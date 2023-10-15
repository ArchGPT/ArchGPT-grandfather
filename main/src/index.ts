import fs from 'fs';
import path from 'path';
import { ArST, makeQuery, FileWithArST } from './parser';
import _ from 'lodash';
import parseGI from 'parse-gitignore'
import { minimatch } from 'minimatch'
import { initHypeEdges } from './readWrite';
import { initDB, searchFiles, searchSegs } from './db';
import { createChatStream } from './runEnv/vercelEdgeChat';

import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export function applyMakeQueryToDir(folderPath: string, gitIgnoredFiles: string[] = []): FileWithArST[] {
  const files = fs.readdirSync(folderPath)

  return _.flatten(files.map((file) => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath)

    const gitIgnoredContentHere = (fs.existsSync(path.join(folderPath, '.gitignore')) && fs.readFileSync(path.join(folderPath, '.gitignore'), 'utf8')) || ''
    const currentIgnoredFiles: string[] = parseGI(gitIgnoredContentHere)?.patterns || []

    const applyToCurrentFolder = currentIgnoredFiles.filter((a) => '/' === a[0])

    if (_.includes([...applyToCurrentFolder.map((a) => a.slice(1).replace(/\/$/, '')), '.git', '.archy'], file)) {
      return []
    }

    const allIgnored = [...gitIgnoredFiles, ..._.without(currentIgnoredFiles, ...applyToCurrentFolder).map((a) => a.replaceAll(".", "\\."))]

    if (allIgnored.some((a) => minimatch(file, a))) {
      return []
    }


    if (stats.isDirectory()) {
      return applyMakeQueryToDir(filePath, allIgnored);
    } else if (stats.isFile()) {
      if ([
        '.js',
        '.ts',
        '.tsx',
        '.jsx'
      ].some((a) => path.extname(filePath).endsWith(a))) {
        const content = fs.readFileSync(filePath, 'utf8')
        // return []
        return makeQuery(content, filePath);
      }
    }
    return []

  }))

}

export const initArchGPT = async (folder: string = '../../example-todo-list/') => {

  const hs = initHypeEdges(folder, { fromScratch: true })

  const { db, tables } = await initDB(folder, hs, { fromScratch: false })


  // const files = await searchFiles(tables[0], "User Interface", { nameOnly: true })
  // const segs = await searchSegs(tables[1], "User Interface", { nameOnly: true })


  // console.log(files);

  return {
    searchFiles: async (query: string, options: { nameOnly?: boolean } = {}) => {
      return await searchFiles(tables[0], query, options)
    },
    searchSegs: async (query: string, options: { nameOnly?: boolean } = {}) => {
      return await searchSegs(tables[1], query, options)
    },
    runPrompt: async (purpose: string, config: ArchPromptObject): Promise<any> => {
      const mainMessage = await promptPurposeMap[purpose](
        config.fileTitle,
        config.description,
        config.basedOn
      )
      const result = await openai.chat.completions.create({
        model: config.llm,
        messages: mainMessage,
      });
      return result.choices[0].message.content
    },
    composeMessage: () => { }
  }

}

export type Config = {
  basedOn: ArST[]
  fileTitle: string
  description: string
  llm: LLMType
  llmConfig: LLMConfig
}

export type ArchPromptObject = Config & {
  purpose: PromptPurpose,
  promptObj: ArST[],
  fileTitle: string,
  result: string
}

export type LLMType = "gpt-4" | "gpt-3.5-turbo" | "codellama"

export type LLMConfig = {
  ollamaPort?: number
}

export type promptObj = {
  mode: LLMType,
  messages: string[]
  purpose: PromptPurpose
  config: Config
}

export type PromptPart = ''

export type PromptPurpose = "CREATE_FILE" | "EDIT_FILE" | "CREATE_SEG" | "EDIT_SEG"


const createFile = (fileTitle, description, ArST: ArST[]) => `Here is the content of \`${fileTitle}\`:

\`\`\`typescript
${ArST[0].str}
\`\`\`

create a new file based on description:

> ${description}
`

const editFile = (fileTitle, description, ArST: ArST[]) => `Here is the content of \`${fileTitle}\`:

\`\`\`typescript
${ArST[0].str}
\`\`\`

edit this file based on description:
> ${description}

`

const promptPurposeMap = {
  "CREATE_FILE": createFile,
  "EDIT_FILE": editFile,
  // "CREATE_SEG": createSeg,
  // "EDIT_SEG": editSeg,
}
