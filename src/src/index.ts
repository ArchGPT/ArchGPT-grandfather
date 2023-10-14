import fs from 'fs';
import path from 'path';
import { ArST, makeQuery, FileWithArST } from './parser';
import _ from 'lodash';
import parseGI from 'parse-gitignore'
import { minimatch } from 'minimatch'
import { initHypeEdges } from './readWrite';
import { initDB, rankFiles, rankSegs } from './db';

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

export const initEverything = async (folder: string = '../../example-todo-list/') => {

  const hs = initHypeEdges(folder, { fromScratch: true })

  const { db, tables } = await initDB(folder, hs, { fromScratch: false })


  const files = await rankFiles(tables[0], "User Interface", { nameOnly: true })
  const segs = await rankSegs(tables[1], "User Interface", { nameOnly: true })


  // console.log(files);
  console.log(segs);

}