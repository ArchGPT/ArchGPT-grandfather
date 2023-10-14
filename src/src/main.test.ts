import { describe, expect, jest, test } from '@jest/globals';
import { initDB } from './db';
import { flattenArcST, makeQuery } from './parser';
import { applyMakeQueryToDir, initEverything } from '.'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './util';
import path from 'path';
import { initHypeEdges } from './readWrite';
jest.useFakeTimers()

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', async () => {

    await initEverything()


    expect(3).toBe(3);
  }, 10000);
});

