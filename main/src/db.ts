import { connect, Connection, MetricType, Table } from 'vectordb'
import { tableFromArrays, tableFromIPC, tableToIPC, FixedSizeList, Field, Int32, makeVector, Schema, Utf8, Table as ArrowTable, vectorFromArray, Float32 } from 'apache-arrow'
import { readFileSync, writeFileSync } from 'fs'
import { ArST, flattenArST, ArST_withMetaInfo, idOfArST } from './parser'
import path from 'path'
import _ from 'lodash'
import { OpenAIEmbeddingFunction } from './OpenAIEmbeddingFunction'

export type EmbeddingEntry = {
  str: string,
  fileName: string,
  id: string,
  labels: string,
}

const clean = (a: EmbeddingEntry & any): EmbeddingEntry => {
  return {
    str: a.str,
    fileName: a.fileName,
    id: a.id,
    labels: a.labels
  }
}

const schema = new Schema(
  [
    new Field('vector', new FixedSizeList(1536, new Field('float32', new Float32()))),
    new Field('str', new Utf8()),
    new Field('fileName', new Utf8()),
    new Field('id', new Utf8()),
    new Field('labels', new Utf8()),
  ]
)

const getTable = async (db: Connection, option, tableName: string): Promise<[Table<EmbeddingEntry>, boolean, Connection]> => {

  if (option.fromScratch) {
    try {
      await db.dropTable(tableName)
      console.log("DROP TABLE.. & retart", tableName);
    } catch {

    }
  }

  let table
  let shouldInit = false
  const embeddingFunction = new OpenAIEmbeddingFunction("str", process.env.OPENAI_API_KEY!)
  try {
    table = await db.openTable(tableName, embeddingFunction)
  } catch (e) {
    shouldInit = true
    console.log('open table failed:', e);
    table = await db.createTable({ name: tableName, schema, embeddingFunction })
  }
  return [table, shouldInit, db]
}

const checkIfExist = async (trees: ArST[], str: string) => {
  const tree = trees.find((tree) => tree.str === str)
  return tree
}

export const initDB = async (folderPath: string, hs: ArST_withMetaInfo[], option = { fromScratch: false }) => {
  console.log("INIT..");
  const db = await connect(path.join(folderPath, '.archgpt', '.db', 'vector_db'))

  const fileTable = await createFileTable(db, option, hs)

  const segTables = await createSegsTable(
    db,
    option,
    // { fromScratch: false }
    hs
  )


  return { db, tables: [fileTable, segTables] }
}

const createFileTable = async (db, option, hs) => {
  const [table, shouldInit] = await getTable(db, option, 'code')


  /**
   * to start, we only want to embed arcSTs that represent a full file 
   */
  if (shouldInit) {
    const startTime = Date.now()
    const ArSTs = hs.filter((a) => a.ast.nestedIndex.length === 0 && !a.isTest && !a.isConfig)
    // console.log("ArSTs", ArSTs.length);

    const metaEntries = await makeDefaultCategoiesAndSymbol()

    const embeddingEntries: EmbeddingEntry[] = ArSTs.map((a) =>
      makeEntry(a, "FILE")
    )
    console.log("[table add -> embeddingEntries]", embeddingEntries.length, embeddingEntries);

    await table.add([...embeddingEntries, ...metaEntries])
    const endTime = Date.now()
    console.log(`[Table on init] Embedded ${ArSTs.length} ArSTs took ${endTime - startTime} ms`);
  } else {
    console.log("TABLE HAS INITED");
  }

  return table
}

const makeEntry = (f: ArST_withMetaInfo, tags): EmbeddingEntry => {
  return {
    str: f.ast.str!,
    fileName: f.filePath,
    id: f.ast.nestedIndex.join('-'),
    labels: tags
  }
}

const arcSTsForSegs = (hs: ArST_withMetaInfo[]) => {
  const allArcSts: ArST_withMetaInfo[] = hs.flatMap((f) => flattenArST(f.ast).map((a) => ({ ast: a, filePath: f.filePath, imports: f.imports })))
  console.log("allArcSts", allArcSts.length, allArcSts.map((a) => a.ast.label));

  return allArcSts.filter((a) => a.ast.label === "fish_segments")
}

const createSegsTable = async (db: Connection, option, hs: ArST_withMetaInfo[]) => {
  const [table, shouldInit] = await getTable(db, option, "code-segs")
  if (shouldInit) {
    const startTime = Date.now()
    const segs = arcSTsForSegs(hs)
    const metaEntries = await makeDefaultCategoiesAndSymbol()
    const embeddingEntries: EmbeddingEntry[] = segs.map((a) =>
      makeEntry(a, "SEG")
    )
    await table.add([...embeddingEntries, ...metaEntries])
    const endTime = Date.now()
    console.log(`[createSegsTable] Embedding ${segs.length} ArSTs took ${endTime - startTime} ms`);
    // console.log(`[createSegsTable] ${JSON.stringify(embeddingEntries)}`);

  } else {
    console.log("HAS INITED");
  }
  return table

}


export const rankEntry = async (table: Table<EmbeddingEntry>, searchText: string, sql: string, rankOption: RankOption) => {


  const r: Record<string, EmbeddingEntry>[] = await table.search(searchText as any).metricType(MetricType.Cosine).where(sql).execute()

  const r2 = await table.search(searchText as any).metricType(MetricType.L2).where(sql).execute()

  const standard = (r) => r.map((a) => [a.fileName, a._distance, a.id, a.labels])


  if (rankOption.printNamesOnly) {
    return [r.map((a) => a.fileName), r2.map((a) => a.fileName)]
  }

  return [standard(r), standard(r2)]

}

export const searchSegs = (files: ArST_withMetaInfo[]) => async (table: Table<EmbeddingEntry>, searchText: string, rankOption: RankOption) => {

  return await rankEntry(table, searchText,
    // "labels LIKE 'SEG%'",
    "labels='SEG'",
    rankOption)
}

type RankOption = {
  printNamesOnly?: boolean
}
export const searchFiles = (files: ArST_withMetaInfo[], transformFilePath = (a) => a) => async (table: Table<EmbeddingEntry>, searchText: string, rankOption: RankOption) => {

  const result = await rankEntry(table, searchText, "labels='FILE'", rankOption)

  // console.log("all files", files);
  // console.log("X", result, files);


  return result[0].map((a) =>
    _.find(files, { filePath: transformFilePath(a[0]) }))


}

const makeDefaultCategoiesAndSymbol = async (): Promise<EmbeddingEntry[]> => {

  const emptiness: EmbeddingEntry = { str: " ", fileName: "", id: "EMPTY", labels: "SYMBOL" }
  const defaultCategories: EmbeddingEntry[] = [
    "GUI", "Router", "Database",
  ].map((a) => ({ str: a, fileName: "", id: a, labels: "CATEGORY" }))

  return [emptiness, ...defaultCategories]
}

export const clearAllCategory = async (table: Table) => {

  await table.delete("labels='category'")

}

