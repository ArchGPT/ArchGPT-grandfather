import Parser from 'tree-sitter';
import TS from "tree-sitter-typescript"
import fs from 'fs';

const main = async () => {
  // await Parser.init();
  const parser = new Parser();
  parser.setLanguage(TS.typescript);
  console.log('finised')
  const sourceCode = fs.readFileSync('./index.ts', 'utf-8');

  const tree = parser.parse(sourceCode);
  console.log(tree.rootNode.toString());
  // query to get the comments 
  const comments = tree.rootNode.descendantsOfType('comment');
  // console.log(comments);
  // show the comments
  comments.forEach((comment, i) => {
    console.log("COMMENT " + i);
    console.log(comment.text, comment.startIndex);
    const beforeParts = tree.rootNode.children.filter((node) => node.endIndex < comment.startIndex);
    console.log(beforeParts.map((node) => node.text));

  });



};

export default main

main();