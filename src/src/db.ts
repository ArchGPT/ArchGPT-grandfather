import { connect, Connection, EmbeddingFunction, MetricType, OpenAIEmbeddingFunction, Table } from 'vectordb'
import { tableFromArrays, tableFromIPC, tableToIPC, FixedSizeList, Field, Int32, makeVector, Schema, Utf8, Table as ArrowTable, vectorFromArray, Float32 } from 'apache-arrow'
import { readFileSync, writeFileSync } from 'fs'
import { ArST, flattenArcST, FileWithArST, idOfArcST } from './parser'
import path from 'path'
import _ from 'lodash'


type EmbeddingEntry = {
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

const getTable = async (db: Connection, option, tableName = 'code'): Promise<[Table<EmbeddingEntry>, boolean, Connection]> => {

  if (option.fromScratch) {
    await db.dropTable(tableName)
    console.log("DROP TABLE.. & retart", tableName);
  }


  let table
  let shouldInit = false
  const embeddingFunction = new OpenAIEmbeddingFunction("str", process.env.OPENAI_API_KEY)
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

export const initDB = async (folderPath: string, hs: FileWithArST[], option = { fromScratch: false }) => {
  console.log("INIT..");
  const db = await connect(path.join(folderPath, '.archy', '.db', 'vector_db'))

  const [table, shouldInit] = await getTable(db, option)


  /**
   * to start, we only want to embed arcSTs that represent a full file 
   */
  if (shouldInit) {
    const startTime = Date.now()
    const ArcSTs = hs.filter((a) => a.ast.nestedIndex.length === 0 && !a.isTest && !a.isConfig)
    // console.log("ArcSTs", ArcSTs.length);

    const metaEntries = await makeDefaultCategoiesAndSymbol()

    const embeddingEntries: EmbeddingEntry[] = ArcSTs.map((a) =>
      makeEntry(a, "FILE")
    )
    await table.add([...embeddingEntries, ...metaEntries])
    const endTime = Date.now()
    console.log(`Embedding ${ArcSTs.length} ArcSTs took ${endTime - startTime} ms`);
  } else {
    console.log("HAS INITED");

  }

  const segTables = await createSegsTables(db, hs)


  return { db, tables: [table, segTables] }
}

const makeEntry = (f: FileWithArST, tags) => {
  return {
    str: f.ast.str,
    fileName: f.filePath,
    id: f.ast.nestedIndex.join('-'),
    labels: tags
  }
}

const arcSTsForSegs = (hs: FileWithArST[]) => {
  const allArcSts: FileWithArST[] = hs.flatMap((f) => flattenArcST(f.ast).map((a) => ({ ast: a, filePath: f.filePath, imports: f.imports })))
  console.log("allArcSts", allArcSts.length, allArcSts.map((a) => a.ast.label));

  return allArcSts.filter((a) => a.ast.label === "fish_segments")
}

const createSegsTables = async (db: Connection, hs: FileWithArST[]) => {
  const [table, shouldInit] = await getTable(db, { fromScratch: true }, "code-segs")
  if (shouldInit) {
    const startTime = Date.now()
    const segs = arcSTsForSegs(hs)
    const metaEntries = await makeDefaultCategoiesAndSymbol()
    const embeddingEntries: EmbeddingEntry[] = segs.map((a) =>
      makeEntry(a, "SEG")
    )
    await table.add([...embeddingEntries, ...metaEntries])
    const endTime = Date.now()
    console.log(`Embedding ${segs.length} ArcSTs took ${endTime - startTime} ms`);
  } else {
    console.log("HAS INITED");
  }
  return table

}


export const rankEntry = async (table: Table<EmbeddingEntry>, searchText: string, sql: string, rankOption: RankOption) => {


  const r: Record<string, EmbeddingEntry>[] = await table.search(searchText as any).metricType(MetricType.Cosine).where(sql).execute()

  const r2 = await table.search(searchText as any).metricType(MetricType.L2).where(sql).execute()

  const standard = (r) => r.map((a) => [a.fileName, a._distance, a.id, a.labels])


  if (rankOption.nameOnly) {
    return [r.map((a) => a.fileName), r2.map((a) => a.fileName)]
  }

  return [standard(r), standard(r2)]

}

export const rankSegs = async (table: Table<EmbeddingEntry>, searchText: string, rankOption: RankOption) => {

  return await rankEntry(table, searchText,
    // "labels LIKE 'SEG%'",
    "labels='SEG'",
    rankOption)
}

type RankOption = {
  nameOnly?: boolean
}
export const rankFiles = async (table: Table<EmbeddingEntry>, searchText: string, rankOption: RankOption) => {

  return await rankEntry(table, searchText, "labels='FILE'", rankOption)

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

