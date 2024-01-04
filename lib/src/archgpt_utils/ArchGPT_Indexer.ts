import fs from "fs";
import md5 from "md5";
import { EmbeddingFunction } from "vectordb";
import OpenAI from "openai";
import _ from "lodash";

export class ArchGPT_Indexer implements EmbeddingFunction<string> {
  private readonly _openai: any;
  private readonly _modelName: string;

  constructor(
    sourceColumn: string,
    openAIKey: string,
    modelName: string = "text-embedding-ada-002"
  ) {
    let openai;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      openai = require("openai");
    } catch {
      throw new Error("please install openai using npm install openai");
    }

    this.sourceColumn = sourceColumn;
    this._openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: openAIKey,
    });
    this._modelName = modelName;
  }

  async embed(_data: string[] | number[][]): Promise<number[][]> {
    const cacheFolder = "./.openai-embedding-cache";
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder);
    }
    // console.log("data <_> ", _data);

    if (_data.length === 0) {
      return [[0]];
    }
    if (_data.length === 1 && _data[0].length === 0) {
      return [[0]];
    }
    if (_.isNumber(_data[0]?.[0])) {
      return _data as number[][];
    }

    const strings = _data as string[];
    const hashes = strings.map((a) => md5(a));

    const patch = _.chunk(strings, 5);
    const patchHashes = _.chunk(hashes, 5);

    const embeddings: number[][] = [];

    for (let index = 0; index < patch.length; index++) {
      const data = patch[index];
      const hashes = patchHashes[index];
      // check if cache exists
      const cacheExistsForAll = hashes.every((hash) => {
        return fs.existsSync(`${cacheFolder}/${hash}.json`);
      });
      if (cacheExistsForAll) {
        console.log("cache exists for all", hashes);
        for (let i = 0; i < hashes.length; i++) {
          const hash = hashes[i];
          const cacheFile = `${cacheFolder}/${hash}.json`;
          const cache = JSON.parse(fs.readFileSync(cacheFile).toString());
          const embedding = cache.embedding as number[];
          embeddings.push(embedding);
        }
        continue;
      } else {
        // to-do: filter out the ones that already exist
      }

      const response = await (this._openai as OpenAI).embeddings.create({
        model: this._modelName,
        input: data as string[],
      });
      // console.log("io", data, response.data);
      for (let i = 0; i < response.data.length; i++) {
        const embedding = response.data[i].embedding as number[];
        embeddings.push(embedding);

        //cache embedding as files (where file name is hash of the original content)
        const hash = hashes[i];
        const cacheFile = `${cacheFolder}/${hash}.json`;
        const cache = {
          data,
          embedding,
        };
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
      }
    }

    return embeddings;
  }

  sourceColumn: string;
}

// const response = await fetch(`${LL_MARKET_URL}/api/llm/${this._modelName}`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             data,
//           }),
//         });
//       const json: { embeddings: number[][] } = await response.json()
//       return json.embeddings;
