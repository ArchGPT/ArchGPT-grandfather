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

// The basic thing that ArchGPT can do is to make calls to
// - OpenAI's GPT4
// - LL.MARKET 
// - local Ollama