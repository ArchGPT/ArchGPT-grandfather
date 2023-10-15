import { describe, expect, test } from '@jest/globals';
import { initDB } from './db';
import { FileWithArST, flattenArST, makeQuery } from './parser';
import { applyMakeQueryToDir } from '.'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './util';
import path from 'path';


export const writeToFolder = (hs: FileWithArST[], folder: string) => {
  // writing into .archy folder
  hs.forEach((h) => {
    const fp = h.filePath
    // create .archy folder 
    fs.mkdirSync(folder + ".archy/.db/vector_db", { recursive: true })


    // write into .archy folder 
    const realPath = fp.replace(folder, '')
    console.log('realPath', realPath);

    writeFileSyncAndCreateFolderINE(path.join(folder + '.archy', realPath + '.json'), JSON.stringify(h, null, 2))

  })

}

// do so recurisvely 
export const readFromFolder = (folder: string): FileWithArST[] => {
  const files = fs.readdirSync(folder)
  const hs: FileWithArST[] = []
  files.forEach((file) => {
    const filePath = path.join(folder, file);
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      hs.push(...readFromFolder(filePath))
    } else if (stats.isFile()) {
      if (['.json'].some((a) => path.extname(filePath).endsWith(a))) {
        const content = fs.readFileSync(filePath, 'utf8')
        hs.push(JSON.parse(content))
      }
    }
  })
  return hs
}

export type HS_INIT_Option = {
  fromScratch?: boolean
}

// init -> read from folder if not, otherwise call applyMakeQueryToDir
export const initHypeEdges = (folder: string, initOption: HS_INIT_Option): FileWithArST[] => {
  const hs: FileWithArST[] = []
  if (!initOption.fromScratch && fs.existsSync(path.join(folder, '.archy'))) {
    hs.push(...readFromFolder(path.join(folder, '.archy')))
  } else {
    hs.push(...applyMakeQueryToDir(folder))
  }
  return hs

}

export const detectHyperEdgesDiff = (hs1: FileWithArST[], hs2: FileWithArST[]) => {
  const hs1Str = hs1.map((h) => h.str)
  const hs2Str = hs2.map((h) => h.str)
  const diff = hs1Str.filter((h) => !hs2Str.includes(h))
  return diff
}