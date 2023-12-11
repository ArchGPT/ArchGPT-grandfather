import fs from 'fs';
import path from 'path';
import { ArST, ArST_withMetaInfo, initializeParpser, TreeSitterParser, TreeSitterQuery, TreeSitterLangs } from './parser';
import _ from 'lodash';
import parseGI from 'parse-gitignore'
import { minimatch } from 'minimatch'
import { initHypeEdges } from './readWrite';
import { initDB, searchFiles, searchSegs } from './db';

import OpenAI from "openai";
import { CallbackObj, localLLMs, runViaOllama } from './localLLM';
import { APIPromise } from 'openai/core';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources';

import { defaultTemplates } from './defaultTemplates';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { runViaOpenAI } from './remoteLLM';


export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, dangerouslyAllowBrowser: true, });

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
  converDBPathToMatchF_Path?: (path: string) => string
}

export const initArchGPT = (option: ArchGPTOption = {}) => {


  let hs = []
  let db = null
  let tables = []

  console.log("initalizing initArchGPT..");

  const archGPT = {
    history: {},

    initHypeEdges: async (folder: string): Promise<void> => {
      hs = initHypeEdges(folder, { fromScratch: false })
    },
    initParser: (Parser: TreeSitterParser, Query: TreeSitterQuery, langs: TreeSitterLangs) => {

      return initializeParpser(Parser, Query, langs)
    },
    initDB: async (folder: string): Promise<void> => {
      const r = await initDB(folder, hs, { fromScratch: false })
      db = r.db
      tables.push(r.tables)
    },
    searchFiles: async (query: string, options: { nameOnly?: boolean } = {}): Promise<ArST_withMetaInfo[]> => {


      const r = searchFiles(hs, option.converDBPathToMatchF_Path)(tables[0], query, options)
      return r
    },
    searchSegs: async (query: string, options: { nameOnly?: boolean } = {}) => {
      return await searchSegs(hs)(tables[1], query, options)
    },
    runPrompt: async (purpose: string, _config: PromptConfig | PromptConfigToUseTemplate,): Promise<string> => {

      const id: string = _config.id || "default_id"
      const streamInterpreter = _config.intrepretStream?.()


      const toLoad = (_config as PromptConfigToUseTemplate).loadPromptTemplate
      const config: PromptConfig = toLoad ? defaultTemplates![toLoad]((_config as PromptConfigToUseTemplate).promptTemplateData) : _config as PromptConfig

      console.log("config.llm", config.llm);


      if (!streamInterpreter && !_config.filePath) {
        console.log("config.intrepretStream is not defined, we will not stream");
        throw "TO BE IMPLEMENTED"
      }

      let historyIndex

      if (_config.savedToHistory) {
        if (!archGPT.history[id]) { archGPT.history[id] = [] }
        historyIndex = archGPT.history[id].length
        archGPT.history[id].push("")
      }

      if (_config.filePath) {
        // if file doesn't exist, create it
        // (and if folder doesn't exist, create it)
        if (!fs.existsSync(_config.filePath)) {
          fs.mkdirSync(path.dirname(_config.filePath), { recursive: true })
          fs.writeFileSync(_config.filePath, "")
        }
      }

      const interpreter: CallbackObj = {
        take: (str: string) => {
          if (!_.isString(str)) return
          if (streamInterpreter)
            streamInterpreter.take?.(str)
          if (_config.savedToHistory) {
            archGPT.history[id][historyIndex] += str
          }
          if (_config.filePath) {
            console.log("_config.filePath", _config.filePath);

            fs.appendFileSync(_config.filePath, str)
          }

        }, shouldContinue: () => {
          if (streamInterpreter)
            return streamInterpreter.shouldContinue()
          return true
        }
      }



      if (_.includes(localLLMs, config.llm)) {
        const stringPrompt = config.prompt as string
        await runViaOllama({
          llm: config.llm,
          prompt: stringPrompt
        }, interpreter)
      } else {

        const fullPrompt = config.prompt as Array<ChatCompletionMessageParam>

        console.log("[fullPrompt] - runViaOpenAI", fullPrompt);

        await runViaOpenAI({
          llm: config.llm,
          prompt: fullPrompt,
          gptConfig: config.gptConfig
        }, interpreter)
      }

      return ""

    },
    composeMessage: async (purpose: string, config: PromptConfig): Promise<[string, string]> => {
      const [systemMsg, mainMessage] = await promptPurposeMap[purpose](
        config.description,
        config.basedOn
      )
      return [systemMsg, mainMessage]
    }
  }

  return archGPT
}

export const furtherExtendPromptByPurpose = async () => {
  // const [systemMsg, mainMessage] = await promptPurposeMap[purpose](
  //   config.description,
  //   config.basedOn
  // )
}

export type PromptConfig = {

  basedOn: ArST_withMetaInfo[]
  description: string
  llm: LLMType

  prompt: String | Array<ChatCompletionMessageParam>,
  gptConfig?: Partial<ChatCompletionCreateParamsBase>

} & PromptConfigBased

export type PromptConfigToUseTemplate = {
  loadPromptTemplate: string
  promptTemplateData: any
} & PromptConfigBased


export type PromptConfigBased = {
  id?: string
  savedToHistory?: boolean
  filePath?: string

  intrepretStream?: () => CallbackObj
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
