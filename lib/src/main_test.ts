import { describe, expect, jest, test } from '@jest/globals';
import { initDB } from './db';
import { flattenArST } from './parser';
import { applyMakeQueryToDir, initArchGPT, openai } from '.'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './util';
import path from 'path';
import { initHypeEdges } from './readWrite';
import { runViaOllama } from './localLLM';
import { runViaOpenAI } from './remoteLLM';
// jest.useFakeTimers()






// describe('test archGPT template - gpt4-react-tailwind', () => {
//   // test('init', async () => {


//   //   const archGPT = initArchGPT()

//   //   let buffer = ''

//   //   const json = { "hello": 4 }

//   //   await archGPT.runPrompt("CREATE_FILE", {
//   //     id: "test",
//   //     savedToHistory: true,
//   //     loadPromptTemplate: "gpt4-react-tailwind",
//   //     promptTemplateData: {
//   //       json
//   //     },
//   //     gptConfig: {
//   //       max_tokens: 20
//   //     },
//   //     intrepretStream: () => {
//   //       return {
//   //         shouldContinue: () => true,
//   //         take: (str) => {
//   //           if (str) {
//   //             buffer += str
//   //             console.log("[S]", buffer)

//   //           }
//   //         }
//   //       }
//   //     }
//   //   })
//   //   expect(archGPT.history["test"][0].length).toBeGreaterThan(0)
//   //   console.log(archGPT.history);

//   // }, 100_000)
//   test("create file", async () => {


//     const archGPT = initArchGPT()


//     const json = { "hello": 4 }

//     await archGPT.runPrompt("CREATE_FILE", {
//       id: "test",
//       filePath: "../test-output/hello.tsx",
//       savedToHistory: true,
//       loadPromptTemplate: "gpt4-react-tailwind",
//       promptTemplateData: {
//         json
//       },
//       gptConfig: {
//         max_tokens: 20
//       }
//     })
//     // expect file to exist 
//     expect(fs.existsSync("../test-output/hello.tsx")).toBe(true)

//     // read file and get length
//     const fileLength = readFileSync("../test-output/hello.tsx").length
//     expect(fileLength).toBeGreaterThan(0)

//     // rm file completely 
//     fs.unlinkSync("../test-output/hello.tsx")
//     // expect file to not exist
//     expect(fs.existsSync("../test-output/hello.tsx")).toBe(false)

//   }, 100_000)
// })

