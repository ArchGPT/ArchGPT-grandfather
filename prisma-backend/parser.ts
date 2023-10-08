import Parser, { Query } from 'tree-sitter';
import TS from "tree-sitter-typescript"
import fs from 'fs';
import _ from 'lodash'
const main = async () => {
  // await Parser.init();

  console.log('finised')
  const sourceCode = fs.readFileSync('./index.ts', 'utf-8');


  const [pairs] = getPairs(sourceCode);
  console.log(pairs);


};

// e.g.
// /// ><> show
// ....
// ....
// ///---

const getPairs = (str: string, option?: { all: boolean }) => {
  const parser = new Parser();
  parser.setLanguage(TS.typescript);
  const tree = parser.parse(str);
  console.log(tree.rootNode.toString());
  // query to get the comments 
  const comments = tree.rootNode.descendantsOfType('comment');
  // console.log(comments);
  // show the comments

  console.log(comments.map((comment) => comment.text));
  console.log('------------------- ');

  // user tree-sitter query
  const query = option.all ? `(
    (comment)@comment
    (_)?@name
    (#match? @comment "/// ><>")
    )` : `(
    (comment)@comment
    .
    (_)?@name
    (#match? @comment "/// ><>")
    )`
  const q = new Query(TS.typescript, query);
  const matches = q.matches(tree.rootNode);

  let newContent = str
  const pairs = matches.map((match) => {
    const comment = match.captures[0].node.text;
    const content = match.captures[1].node.text;
    newContent = newContent.replace(content, ''
      // comment
    )
    newContent = newContent.replace(comment, '')
    return { comment, content };
  })
  // console.log(pairs);
  // remove matched parts from content
  // const newContent = q.captures(tree.rootNode).map((capture) => {
  //   return capture.node.text;
  // }
  // ).reduce((acc, cur) => {
  //   return acc.replace(cur, ``)
  // }, str)


  return [pairs, newContent]
}


const makeQuery = (inputContent: string = fs.readFileSync('./index.ts', 'utf-8')) => {
  const multiAstPairs = []
  let content = inputContent
  let [seg, partion, NAME] = findLastMultiLineSegment(content)
  while (seg) {
    multiAstPairs.push(seg)
    content = content.replace(partion, '/// ><|.>',
      // `/// ><|.> ${NAME}` //to-do - debug NAME & add it back
    )
    console.log("CONTENT", content);
    const [s, p] = findLastMultiLineSegment(content)
    seg = s
    partion = p
  }
  console.log("MULTILINE", multiAstPairs);

  const [singleAstPairs, leftOver] = getPairs(content, { all: false })
  console.log("SINGLELINE", singleAstPairs);

  console.log("LEFT OVER CONTENT", leftOver);
  // to-do: debug why leftOver contains comment


}


const findLastMultiLineSegment = (content: string) => {
  const regx = /(\-\-\-\s*\/\/\/)([.\s\S]+?)\>\<\>\s\/\/\//g;
  const sourceCode = _.reverse(content.split("")).join("")

  const matches = sourceCode.match(regx);
  if (!matches) return [null, null]
  console.log(matches);

  const match = matches[0];
  const str = _.reverse(match.split("")).join("")
  const [pairs] = getPairs(str, { all: true })
  console.log("STR", str);

  console.log("PAIRS", pairs);
  return [pairs, str, pairs[0].comment]

}

export default main

// main();
makeQuery()


// (pair
//   key:(_) @x
//   value:(_) @b  
//   (#eq? @x "data")
// )