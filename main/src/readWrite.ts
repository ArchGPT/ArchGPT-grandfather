import { describe, expect, test } from '@jest/globals';
import { initDB } from './db';
import { ArST_withMetaInfo, flattenArST } from './parser';
import { applyMakeQueryToDir } from '.'
import fs, {
  readFileSync, writeFileSync,

} from 'fs'
import { writeFileSyncAndCreateFolderINE } from './util';
import path from 'path';


export const writeToFolder = (hs: ArST_withMetaInfo[], folder: string) => {
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
export const readFromFolder = (folder: string): ArST_withMetaInfo[] => {
  const files = fs.readdirSync(folder)
  const hs: ArST_withMetaInfo[] = []
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
export const initHypeEdges = (folder: string, initOption: HS_INIT_Option): ArST_withMetaInfo[] => {
  const hs: ArST_withMetaInfo[] = []
  const archyFolder = path.join(folder, '.archy')
  const exist = fs.existsSync(archyFolder)

  if (!initOption.fromScratch && exist && fs.readdirSync(archyFolder).filter((a) => !a.startsWith(".")).length > 0) {
    hs.push(...readFromFolder(path.join(folder, '.archy')))
  } else {
    console.log("[applyMakeQueryToDir]");

    hs.push(...applyMakeQueryToDir(folder))
  }
  return hs

}

export const detectHyperEdgesDiff = (hs1: ArST_withMetaInfo[], hs2: ArST_withMetaInfo[]) => {
  const hs1Str = hs1.map((h) => h.str)
  const hs2Str = hs2.map((h) => h.str)
  const diff = hs1Str.filter((h) => !hs2Str.includes(h))
  return diff
}