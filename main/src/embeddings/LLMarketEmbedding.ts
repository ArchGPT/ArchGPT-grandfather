import { EmbeddingFunction } from 'vectordb';
import { LL_MARKET_URL } from '../../constants/LL_MARKET_URL';


export class LLMarketEmbedding implements EmbeddingFunction<string> {
  private readonly _openai: any;
  private readonly _modelName: string;

  constructor(sourceColumn: string, openAIKey: string, modelName: string = 'codebase-indexer') {


    this.sourceColumn = sourceColumn;

    this._modelName = modelName;
  }

  async embed(data: string[]): Promise<number[][]> {
    // console.log("DATA <_>", data);
    try {
      const response = await fetch(`${LL_MARKET_URL}/api/llm/${this._modelName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
          }),
        });
      const json: { embeddings: number[][] } = await response.json()
      return json.embeddings;

    } catch {
      return []
    }
  }

  sourceColumn: string;
}
