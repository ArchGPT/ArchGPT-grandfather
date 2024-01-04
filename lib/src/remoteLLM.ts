import { ChatCompletionMessageParam } from 'openai/resources';
import { openai } from '.';
import { CallbackObj } from './localLLM';
import axios from 'axios';
import { LL_MARKET_URL } from '../constants/LL_MARKET_URL';

type OpenAILLM = string

type RemoteGPTConfig = {
  llm: OpenAILLM,
  prompt: Array<ChatCompletionMessageParam >
  gptConfig?: any
}

export const runViaOpenAI = async (config: RemoteGPTConfig, callbackObj: CallbackObj) => {
  const obj = callbackObj

  const stream: any = await openai.chat.completions.create({
    model: config.llm,
    stream: true,
    messages: config.prompt,
    ...config.gptConfig

  });
  for await (const part of stream) {
    if (obj.shouldContinue() === false) {
      break
    }
    obj.take?.(part.choices[0]?.delta?.content)
  }

};


export const runViaLLMarket = async (config: RemoteGPTConfig, callbackObj: CallbackObj) => {
  const LL_MARKET_API_KEY = process.env.LL_MARKET_API_KEY


  const obj = callbackObj

  // axios HTTP stream call to https://ll.market/api/llm/test 
  const stream: any = await axios.post(`${LL_MARKET_URL}/api/llm/${config.llm}`, {
    prompt: config.prompt,
    ...(config.gptConfig || {})
  }, {
    headers: {
      "market-api-key": LL_MARKET_API_KEY
    },
    responseType: 'stream'
  })

  return new Promise((resolve, reject) => {

    stream.data.on('data', (chunk: any) => {
      // console.log(chunk);
      if (obj.shouldContinue() === false) {
        resolve("destoryed")
        stream.data.destroy()
      }
      obj.take?.(chunk.toString())
    })

    stream.data.on('end', () => {
      console.log("stream done");
      resolve("done")
    });

    stream.data.on('error', (err: any) => {
      console.log("stream error");
      reject(err)
    })

  })


}
