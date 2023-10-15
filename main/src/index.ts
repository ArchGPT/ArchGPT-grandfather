import fs from 'fs';
import path from 'path';
import { ArST, makeQuery, ArST_withMetaInfo } from './parser';
import _ from 'lodash';
import parseGI from 'parse-gitignore'
import { minimatch } from 'minimatch'
import { initHypeEdges } from './readWrite';
import { initDB, searchFiles, searchSegs } from './db';

import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export function applyMakeQueryToDir(folderPath: string, gitIgnoredFiles: string[] = []): ArST_withMetaInfo[] {
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

type ArchGPTOption = {
  converDBPathToMatchF_Path: (path: string) => string
}

export const initArchGPT = async (folder: string = '../../example-todo-list/', option: ArchGPTOption) => {

  const hs = initHypeEdges(folder, { fromScratch: false })

  const { db, tables } = await initDB(folder, hs, { fromScratch: false })


  const fns = {
    searchFiles: async (query: string, options: { nameOnly?: boolean } = {}): Promise<ArST_withMetaInfo[]> => {


      const r = searchFiles(hs, option.converDBPathToMatchF_Path)(tables[0], query, options)
      return r
    },
    searchSegs: async (query: string, options: { nameOnly?: boolean } = {}) => {
      return await searchSegs(hs)(tables[1], query, options)
    },
    runPrompt: async (purpose: string, config: PromptConfig): Promise<string> => {
      const [systemMsg, mainMessage] = await promptPurposeMap[purpose](
        config.description,
        config.basedOn
      )
      const result = await openai.chat.completions.create({
        model: config.llm,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: mainMessage }
        ]

      });
      return result.choices[0].message.content
    },
    composeMessage: async (purpose: string, config: PromptConfig): Promise<[string, string]> => {
      const [systemMsg, mainMessage] = await promptPurposeMap[purpose](
        config.description,
        config.basedOn
      )
      return [systemMsg, mainMessage]
    }
  }

  return fns
}

export type PromptConfig = {
  basedOn: ArST_withMetaInfo[]
  description: string
  llm: LLMType
}



export type LLMType = "gpt-4" | "gpt-3.5-turbo" | "codellama"



export type PromptPart = ''

export type PromptPurpose = "CREATE_FILE" | "EDIT_FILE" | "CREATE_SEG" | "EDIT_SEG"


const createFile = (description: string, ArST: ArST_withMetaInfo[]) => [`Given a file or code snippet, you will implement a feature based on an english description.`, `Here is the content of \`${ArST[0].filePath}\`:

\`\`\`typescript
${ArST[0].ast.str}
\`\`\`

create a new file based on description:

> ${description}
`]

const editFile = (description: string, ArST: ArST_withMetaInfo[]) => [`Given a file or code snippet, you will implement a feature based on an english description.`, `Here is the content of \`${ArST[0].filePath}\`:

\`\`\`typescript
${ArST[0].ast.str}
\`\`\`

edit this file based on description:
> ${description}

`]


const promptPurposeMap = {
  "CREATE_FILE": createFile,
  "EDIT_FILE": editFile,
  // "CREATE_SEG": createSeg,
  // "EDIT_SEG": editSeg,
}
