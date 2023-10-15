import { describe, expect, jest, test } from '@jest/globals';
import { initDB } from './db';
import { flattenArST, makeQuery } from './parser';
import { applyMakeQueryToDir, initArchGPT } from '.'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './util';
import path from 'path';
import { initHypeEdges } from './readWrite';
jest.useFakeTimers()

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', async () => {

    const folder = path.join(__dirname, '../../../example-todo-list/')

    const archGPT = await initArchGPT(folder, {
      converDBPathToMatchF_Path: (path: string) => path.replace("../../", "../")
    })

    const ArSTs = await archGPT.searchFiles("to do list")


    const description = "allow users to assign a todo item to existing members in a team"

    const result = await archGPT.runPrompt("CREATE_FILE", {
      basedOn: ArSTs, description, llm: "gpt-4",
    })
    console.log(result);


    expect(3).toBe(3);
  }, 10000);
});

