import { openai } from '.';
import { CallbackObj } from './localLLM';

type OpenAILLM = string

type OpenAIConfig = {
  llm: OpenAILLM,
  prompt: any
  gptConfig: any
}

export const runViaOpenAI = async (config: OpenAIConfig, callbackObj: CallbackObj) => {
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
