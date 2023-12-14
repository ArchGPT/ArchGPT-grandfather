import { describe, expect, jest, test } from '@jest/globals';
import { initDB } from './src/db';
import { ArST_withMetaInfo, flattenArST } from './src/parser';
import { ARCH_GPT, applyMakeQueryToDir, initArchGPT, openai } from './src'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './src/util';
import path from 'path';
import { initHypeEdges } from './src/readWrite';
import { runViaOllama } from './src/localLLM';
import { runViaLLMarket, runViaOpenAI } from './src/remoteLLM';

const _describe = (...a) => {/*skip*/ }

// The basic thing that ArchGPT can do is to make calls to
// - OpenAI's GPT4
// - LL.MARKET 
// - local Ollama

_describe('test: OpenAI\'s GPT4 ', () => {
  test('simple', async () => {


    let shouldGo = true
    let buffer = ''
    setTimeout(() => {
      shouldGo = false
    }, 3000)

    await runViaOpenAI({
      llm: "gpt-3.5-turbo",
      prompt: [
        { role: 'system', content: "hello give me a poem about cats" },
      ],
      gptConfig: {
        max_tokens: 200
      }
    }, {
      shouldContinue: () => shouldGo,
      take: (str) => {
        buffer += str
      }
    })
    console.log(buffer);

  }, 10_000)
})

_describe('test: LL.MARKET ', () => {
  test('simple', async () => {

    let shouldGo = true
    let buffer = ''
    setTimeout(() => {
      shouldGo = false
    }, 3000)

    await runViaLLMarket({
      llm: "archgpt-decision-maker",
      prompt: ["replace"]
    }, {
      shouldContinue: () => shouldGo,
      take: (str) => {
        buffer += str
      }
    })
    console.log(buffer);

  }, 30_000)
})


_describe('test: local Ollama ', () => {
  test('simple', async () => {

    let shouldGo = true

    setTimeout(() => {
      shouldGo = false
    }, 3000)

    await runViaOllama({
      llm: "codellama:7b",
      prompt: "Here is a story about llamas smoking grass"
    }, {
      shouldContinue: () => shouldGo,
      take: (str) => {
        console.log("str", str);
      }
    })



  }, 10_000)
})




// Next, we need to make sure ArchGPT's encoding with `codebase-indexer` & vector DB are working


const folder = path.join(__dirname, '../example-todo-list/')
console.log("folder", folder);

import Parser, { Query } from 'tree-sitter';
import TS from "tree-sitter-typescript"


let archGPT: ARCH_GPT
let ArSTs: ArST_withMetaInfo[]
describe('test archGPT basic ', () => {
  test('init', async () => {

    archGPT = await initArchGPT()
    const parser = archGPT.initParser(Parser, Query, TS)
    //   console.log("parser", parser);

    await archGPT.initHypeEdges(folder, parser)
    await archGPT.initDB(folder)

  }, 100_000);

  test('search files', async () => {

    ArSTs = await archGPT.searchFiles("to do list")
    const files = ArSTs.map((a) => a.filePath)
    console.log("files", files);

  }, 100_000);

  // test('gpt4 gen', async () => {

  //   const d = [
  //     { role: "system", content: "allow users to assign a todo item to existing members in a team" }]

  //   const result = await archGPT.runPrompt("CREATE_FILE", {
  //     basedOn: ArSTs, promptInput: d, llm: "gpt-4",
  //     gptConfig: {
  //       max_tokens: 1,
  //     }
  //   })
  //   expect(result.length).toBeGreaterThan(0)

  // }, 100_000);


  // test('ollama gen', async () => {

  //   const description = "allow users to assign a todo item to existing members in a team"

  //   const result = await archGPT.runPrompt("CREATE_FILE", {
  //     basedOn: ArSTs, description, llm: "ollama",
  //     gptConfig: {
  //       max_tokens: 1,
  //     }
  //   })
  //   expect(result.length).toBeGreaterThan(0)

  // }, 100_000);
});


// Lastly, we should test 


