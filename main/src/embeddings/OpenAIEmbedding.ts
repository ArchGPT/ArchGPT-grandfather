import { EmbeddingFunction } from 'vectordb';
import OpenAI from "openai";
import _ from 'lodash';


export class OpenAIEmbeddingFunction implements EmbeddingFunction<string> {
  private readonly _openai: any;
  private readonly _modelName: string;

  constructor(sourceColumn: string, openAIKey: string, modelName: string = 'text-embedding-ada-002') {
    let openai;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      openai = require('openai');
    } catch {
      throw new Error('please install openai using npm install openai');
    }

    this.sourceColumn = sourceColumn;
    this._openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: openAIKey
    });
    this._modelName = modelName;
  }

  async embed(data: string[] | number[][]): Promise<number[][]> {
    // note: every item in string[] represents a file content
    console.log("data <_> ", data);

    if (data.length === 0) {
      return [[0]]
    }
    if (data.length === 1 && data[0].length === 0) {
      return [[0]]
    }
    if (_.isNumber(data[0]?.[0])) {
      return data as number[][]
    }


    const response = await (this._openai as OpenAI).embeddings.create({
      model: this._modelName,
      input: data as string[]
    });
    const embeddings: number[][] = [];
    // console.log("io", data, response.data);
    for (let i = 0; i < response.data.length; i++) {
      embeddings.push(response.data[i].embedding as number[]);
    }
    return embeddings;
  }

  sourceColumn: string;
}
