import { EmbeddingFunction } from 'vectordb';
import { LL_MARKET_URL } from '../../constants/LL_MARKET_URL';


export class LLMarketEmbedding implements EmbeddingFunction<string> {
  private readonly _openai: any;
  private readonly _modelName: string;

  constructor(sourceColumn: string, openAIKey: string, modelName: string = 'codebase-indexer') {
    let openai;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      openai = require('openai');
    } catch {
      throw new Error('please install openai using npm install openai');
    }

    this.sourceColumn = sourceColumn;

    this._modelName = modelName;
  }

  async embed(data: string[]): Promise<number[][]> {
    const response = await fetch(`${LL_MARKET_URL}/api/llm/${this._modelName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data,
          model: this._modelName,
        }),
      });
    const json: { embeddings: number[][] } = await response.json()
    return json.embeddings;
  }

  sourceColumn: string;
}
