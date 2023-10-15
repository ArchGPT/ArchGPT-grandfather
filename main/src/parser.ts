import Parser, { Query } from 'tree-sitter';
import TS from "tree-sitter-typescript"
import fs from 'fs';
import _ from 'lodash'
import { produce } from 'immer'
import { initDB } from './db';
import path from 'path';

const knownConfigFiles = ['next-env.d.ts']

const l = () => { }
// || console.log

const NS = "ArchGPT"

// e.g.
// // ><> show
// ....
// ....
// // ---

const functionNames = ["function_declaration", "arrow_function", "function"]
// all functions have two children: parameters and body
// function_declaration has additional child: name

type Pair = {
  comment: string;
  content: string;
  name: string
}

const getFishSegs = (dict, lang = TS.typescript) => (str: string, option?: { all: boolean }): [Pair[], string[], string] => {

  let newContent = str

  const parser = new Parser();

  parser.setLanguage(lang);
  const tree = parser.parse(str);

  // query to get the comments 
  const comments = tree.rootNode.descendantsOfType('comment');
  // l(comments);
  // show the comments

  l(comments.map((comment) => comment.text));
  l('------------------- ');

  // tree-sitter query to cathc ><> comments
  const query = option.all ? `(
    (comment)@comment
    (_)?@name
    (#match? @comment "// ><>")
    )` : `(
    (comment)@comment
    .
    (_)?@name
    (#match? @comment "// ><>")
    )`
  const q = new Query(TS.typescript, query);

  const importQuery = new Query(TS.typescript, "(import_statement)@import")

  const imports = importQuery.matches(tree.rootNode);

  const iStatements: string[] = imports.map((importNode) => {
    // side-effects:
    newContent = newContent.replace(importNode.captures[0].node.text, '')

    return importNode.captures[0].node.text
  })


  const matches = q.matches(tree.rootNode);
  // console.log("matches", matches);


  const pairs = matches.map((match, i) => {
    const comment = match.captures[0].node.text;
    const content = match.captures[1].node.text;
    const name = comment.match(/\>\<\>\s*(.*)?/)?.[1] || ("ARCHGPT_SINGLE_FISH_" + i)
    // side-effects:
    // console.log("LOL", i);

    newContent = newContent.replace(content, '// ' + NS + ' ><|.> ' + (name))
    newContent = newContent.replace(comment, '')
    console.log("NEW", name, newContent)
    return { comment, content, name };
  })
  // l(pairs);
  // remove matched parts from content
  // const newContent = q.captures(tree.rootNode).map((capture) => {
  //   return capture.node.text;
  // }
  // ).reduce((acc, cur) => {
  //   return acc.replace(cur, ``)
  // }, str)


  return [pairs, iStatements, newContent]
}


function getNodeLabel(parent, child, placeholder) {
  if (!parent.fields) return placeholder
  for (let field of parent.fields) {
    if (parent[field] === child) {
      return field;
    }
  }
  return placeholder; // return null if the child node isn't a direct child of the parent
}

function getNodeLabels(parent, children) {
  let i = 0
  return children.map((child) => getNodeLabel(parent, child, i++));
}

const defaultOption = {
  alwaysShowString: true
}

interface Option {
  alwaysShowString: boolean;
}

type FISH_DICT = { [fishName: string]: string[] }


export type FileWithArST = { imports: string[], ast: ArST, filePath: string, isTest?: boolean, isConfig?: boolean, hasFishAnnotation?: boolean }

export const makeQuery = (inputContent: string = fs.readFileSync('./index.ts', 'utf-8'), filePath = './index.ts',): FileWithArST => {

  const ext = path.extname(filePath)
  let lang = null
  switch (ext) {
    case ".ts":
      lang = TS.typescript
      break;
    case ".js":
      lang = TS.typescript
      break;
    case ".jsx":
      lang = TS.typescript
      break;
    case ".tsx":
      lang = TS.typescript
      break;
  }



  const multiAstPairs: Pair[] = []
  let singleAstPairs: Pair[] = []
  const fishDictionary: FISH_DICT = new Proxy({}, {
    get: function (target, prop: string, receiver) {

      if (prop == "ARCHGPT_SINGLE_FISH_LEGNTH") return singleAstPairs.length

      if (prop.startsWith("ARCGPT_MULTI_FISH")) {
        return [multiAstPairs[parseInt(prop.split("_")[2])].content]
      } else if (prop.startsWith("ARCHGPT_SINGLE_FISH")) {
        return [singleAstPairs[parseInt(prop.split("_")[3])].content]
      }

      const output: string[] = []
      for (const pair of multiAstPairs) {
        if (pair.name === prop) {
          output.push(pair.content)
        }
      }
      for (const pair of singleAstPairs) {
        if (pair.name === prop) {
          output.push(pair.content)
        }
      }

      return output
    }
  })


  let content = inputContent
  let [seg, partion, NAME] = findLastMultiLineFishSegment(fishDictionary, lang)(content)
  while (seg) {
    const i = multiAstPairs.length
    multiAstPairs.push(...seg)
    content = content.replace(partion, `// ${NS} ><|.> ${NAME || "ARCHGPT_MULTI_FISH_" + i}`,
    )
    // l("CONTENT", content);
    const [s, p, n] = findLastMultiLineFishSegment(fishDictionary, lang)(content)
    seg = s
    partion = p
    NAME = n
  }


  const [_singleAstPairs, imports, leftOver] = getFishSegs(fishDictionary, lang)(content, { all: false })



  singleAstPairs = _singleAstPairs

  // l("MULTILINE", multiAstPairs);

  // l("SINGLELINE", singleAstPairs);
  // l("multiAstPairs", multiAstPairs);
  // l("IMPORTS", imports);


  // l("LEFT OVER CONTENT", leftOver);
  const obj = parseAndMakeArST(fishDictionary)(leftOver, [], Infinity)
  // l("AST", JSON.stringify(obj, null, 2));

  return {

    ast: obj, imports, filePath,

    hasFishAnnotation: multiAstPairs.length > 0 || singleAstPairs.length > 0,

    isTest: filePath.includes(".test."),
    isConfig: filePath.includes(".config.") || knownConfigFiles.includes(filePath)
  }
}

// Arch Syntax Tree
export type ArST = {
  nestedIndex: number[]
  label: string | number;
  name: string;
  children?: ArST[];
  childrenLabels?: string[];
  str?: string;
  embedding?: number[];
}




export const idOfArST = (node: ArST) => {
  return node.nestedIndex.join("-") + "_" + node.label.toString() + "_" + node.name
}

const getByIndex = (ast: ArST, index: number[]): ArST => {
  let node = ast
  for (const i of index) {
    node = node.children[i]
  }
  return node
}

export const flattenArST = (ast: ArST): ArST[] => {
  const output: ArST[] = []
  const queue: ArST[] = [ast]
  while (queue.length > 0) {
    const node = queue.shift()
    if (node.children) queue.push(...node.children)
    output.push({ ...node, children: [] })
  }
  return output

}

const makeAsts = (fishDictionary: FISH_DICT) => (nodes: any[], labels: string[], nestedIndex: number[], LEVEL_TO_STOP = 0, option: Option = defaultOption): ArST[] => nodes.map((node, i) => {
  const name = node.type
  const currentNested = [...nestedIndex, i]

  if (name === "comment") {

    if (node.text.startsWith(`// ${NS} ><|.> `)) {

      // inject a fish object from saved ArchGPT dict
      const name = node.text.split(`// ${NS} ><|.> `)[1].trim()
      console.log("FOUND FISH", name);
      const fishParts = fishDictionary[name]

      if (fishParts.length > 0) {
        return {
          nestedIndex: currentNested,
          label: 'fish_segments',
          name,
          childrenLabels: _.range(fishParts.length),
          str: fishParts.join("\n"),
          children: fishParts.map((str, ii) => parseAndMakeArST(fishDictionary)(str, [...currentNested, ii], LEVEL_TO_STOP - 2))
        }
      }
    }

  }

  const children = node.namedChildren
  const childrenLabels = getNodeLabels(node, children)

  const isTerminal = LEVEL_TO_STOP <= 0 || children.length == 0

  const str = (isTerminal || option.alwaysShowString) ? { str: node.text } : {}

  return {
    nestedIndex: currentNested,
    ...str,
    label: labels[i],
    name,
    ...(isTerminal ? {} : {
      childrenLabels,
      children: makeAsts(fishDictionary)(children, childrenLabels, currentNested, LEVEL_TO_STOP - 1, option)
    }),

  }
})

const parseAndMakeArST = (fishDictionary: FISH_DICT) => (content: string, nestedIndex: number[] = [], LEVEL_TO_STOP = 4): ArST => {

  const parser = new Parser();
  parser.setLanguage(TS.typescript);

  const tree = parser.parse(content);
  const firstLayer = tree.rootNode.namedChildren;
  const firstLayerLabels = getNodeLabels(tree.rootNode, firstLayer)

  const children = makeAsts(fishDictionary)(firstLayer, firstLayerLabels, nestedIndex, LEVEL_TO_STOP)

  return {
    nestedIndex,
    label: "FILE",
    name: "root",
    str: content,
    childrenLabels: firstLayerLabels,
    children
  }
}


const findLastMultiLineFishSegment = (dict, lang?: any) => (content: string): [Pair[], string, string] | null[] => {
  const regx = /(\-\-\-\s*\/\/)([.\s\S]+?)\>\<\>\s\/\//g;
  const sourceCode = _.reverse(content.split("")).join("")

  const matches = sourceCode.match(regx);
  if (!matches) return [null, null, null]
  // l("[matches]", matches);

  const match = matches[0];

  const str = _.reverse(match.split("")).join("")
  const [pairs,] = getFishSegs(dict, lang)(str, { all: true })
  l("STR", str);

  l("PAIRS", pairs);

  return [pairs, str, pairs[0].name]

}






// l(a);
// l(getByIndex(ast, [3, 0]))

// (pair
//   key:(_) @x
//   value:(_) @b  
//   (#eq? @x "data")
// )