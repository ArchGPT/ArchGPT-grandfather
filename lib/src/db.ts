import { connect, Connection, MetricType, Table } from "vectordb";
import {
  tableFromArrays,
  tableFromIPC,
  tableToIPC,
  FixedSizeList,
  Field,
  Int32,
  makeVector,
  Schema,
  Utf8,
  Table as ArrowTable,
  vectorFromArray,
  Float32,
} from "apache-arrow";
import { readFileSync, writeFileSync } from "fs";
import { ArST, flattenArST, ArST_withMetaInfo, idOfArST } from "./parser";
import path from "path";
import _ from "lodash";
import { OpenAIEmbeddingFunction } from "./indexers/OpenAI_Indexer";
import { LLMarketEmbedding } from "./indexers/LLMarket_Indexer";

export type EmbeddingEntry = {
  str: string;
  file_name: string;
  id: string;
  labels: string;
};

const clean = (a: EmbeddingEntry & any): EmbeddingEntry => {
  return {
    str: a.str,
    file_name: a.file_name,
    id: a.id,
    labels: a.labels,
  };
};

const schema = new Schema([
  new Field(
    "vector",
    new FixedSizeList(1536, new Field("float32", new Float32()))
  ),
  new Field("str", new Utf8()),
  new Field("file_name", new Utf8()),
  new Field("id", new Utf8()),
  new Field("labels", new Utf8()),
]);

const getTable = async (
  db: Connection,
  option: { fromScratch: boolean },
  tableName: string
): Promise<[Table<EmbeddingEntry>, boolean, Connection]> => {
  if (option?.fromScratch) {
    try {
      await db.dropTable(tableName);
      console.log("DROP TABLE.. & retart", tableName);
    } catch {}
  }

  let table;
  let shouldInit = false;
  // const FN = LLMarketEmbedding
  const FN = OpenAIEmbeddingFunction;
  const embeddingFunction = new FN("str", process.env.OPENAI_API_KEY!);
  try {
    table = await db.openTable(tableName, embeddingFunction);
  } catch (e) {
    shouldInit = true;
    console.log("open table failed:", e);
    table = await db.createTable({
      name: tableName,
      schema,
      embeddingFunction,
    });
  }
  return [table, shouldInit, db];
};

const checkIfExist = async (trees: ArST[], str: string) => {
  const tree = trees.find((tree) => tree.str === str);
  return tree;
};

export const initDB = async (
  folderPath: string,
  hs: ArST_withMetaInfo[],
  option?: { fromScratch: boolean }
) => {
  console.log("INIT..");
  const db = await connect(
    path.join(folderPath, ".archgpt", ".db", "vector_db")
  );

  const fileTable = await createFileTable(db, option, hs);
  const segTables = await createSegsTable(db, option, hs);

  return { db, tables: [fileTable, segTables] };
};

const makeEntry = (f: ArST_withMetaInfo, tags): EmbeddingEntry => {
  return {
    str: f.ast.str!,
    file_name: f.filePath,
    id: f.ast.nestedIndex.join("-"),
    labels: tags,
  };
};

const arcSTsForSegs = (hs: ArST_withMetaInfo[]) => {
  const allArcSts: ArST_withMetaInfo[] = hs.flatMap((f) =>
    flattenArST(f.ast).map((a) => ({
      ast: a,
      filePath: f.filePath,
      imports: f.imports,
    }))
  );
  console.log(
    "allArcSts",
    allArcSts.length,
    allArcSts.map((a) => a.ast.label)
  );

  return allArcSts.filter((a) => a.ast.label === "fish_segments");
};

// const metaEntries = await makeDefaultCategoiesAndSymbol();

const createTable = async (
  db: Connection,
  option,
  hs: ArST_withMetaInfo[],
  tableName: string,
  filterFunc: (a: ArST_withMetaInfo[]) => ArST_withMetaInfo[],
  entryType: string
) => {
  const [table, shouldInit] = await getTable(db, option, tableName);
  if (shouldInit) {
    const startTime = Date.now();
    const filteredHs = filterFunc(hs);
    const embeddingEntries: EmbeddingEntry[] = filteredHs.map((a) =>
      makeEntry(a, entryType)
    );
    await table.add(embeddingEntries);
    const endTime = Date.now();
    console.log(
      `[${tableName} init'ed] Embedded ${filteredHs.length} ArSTs took ${
        endTime - startTime
      } ms`
    );
  } else {
    console.log(`TABLE ${tableName.toUpperCase()} HAS INITED`);
  }
  return table;
};

const createFileTable = async (db, option, hs: ArST_withMetaInfo[]) => {
  return await createTable(
    db,
    option,
    hs,
    "files",
    (hs) =>
      hs.filter((a) => a.ast.label === "FILE" && !a.isTest && !a.isConfig),
    "FILE"
  );
};

const createSegsTable = async (db, option, hs: ArST_withMetaInfo[]) => {
  return await createTable(db, option, hs, "segs", arcSTsForSegs, "SEG");
};

const createTopicTable = async (db, option, hs: ArST_withMetaInfo[]) => {};

export const rankEntry = async (
  table: Table<EmbeddingEntry>,
  searchText: string,
  sql: string,
  rankOption: RankOption
) => {
  const r: Record<string, EmbeddingEntry>[] = await table
    .search(searchText as any)
    .metricType(MetricType.Cosine)
    .where(sql)
    .execute();

  const r2 = await table
    .search(searchText as any)
    .metricType(MetricType.L2)
    .where(sql)
    .execute();

  const standard = (r) =>
    r.map((a) => [a.file_name, a._distance, a.id, a.labels]);

  if (rankOption.printNamesOnly) {
    return [r.map((a) => a.file_name), r2.map((a) => a.file_name)];
  }

  return [standard(r), standard(r2)];
};

export const searchSegs =
  (files: ArST_withMetaInfo[]) =>
  async (
    table: Table<EmbeddingEntry>,
    searchText: string,
    rankOption: RankOption
  ) => {
    return await rankEntry(
      table,
      searchText,
      // "labels LIKE 'SEG%'",
      "labels='SEG'",
      rankOption
    );
  };

type RankOption = {
  printNamesOnly?: boolean;
};
export const searchFiles =
  (files: ArST_withMetaInfo[], transformFilePath = (a) => a) =>
  async (
    table: Table<EmbeddingEntry>,
    searchText: string,
    rankOption: RankOption
  ) => {
    const result = await rankEntry(
      table,
      searchText,
      "labels='FILE'",
      rankOption
    );

    // console.log("all files", files);
    // console.log("X", result, files);

    return result[0].map((a) =>
      _.find(files, { filePath: transformFilePath(a[0]) })
    );
  };

const makeDefaultCategoiesAndSymbol = async (): Promise<EmbeddingEntry[]> => {
  const emptiness: EmbeddingEntry = {
    str: " ",
    file_name: "",
    id: "EMPTY",
    labels: "SYMBOL",
  };
  const defaultCategories: EmbeddingEntry[] = ["GUI", "Router", "Database"].map(
    (a) => ({ str: a, file_name: "", id: a, labels: "CATEGORY" })
  );

  return [emptiness, ...defaultCategories];
};

export const clearAllCategory = async (table: Table) => {
  await table.delete("labels='category'");
};
