import { ReadableStream } from "node:stream/web"

export const localLLMs = ['mistral', 'llama2', 'codellama', 'vicuna', 'orca-mini', 'llama2-uncensored', 'wizard-vicuna-uncensored', 'nous-hermes', 'phind-codellama', 'mistral-openorca', 'wizardcoder', 'wizard-math', 'llama2-chinese', 'stable-beluga', 'codeup', 'everythinglm', 'wizardlm-uncensored', 'medllama2', 'falcon', 'wizard-vicuna', 'open-orca-platypus2', 'zephyr', 'starcoder', 'samantha-mistral', 'wizardlm', 'openhermes2-mistral', 'sqlcoder', 'nexusraven', 'dolphin2.1-mistral']

type OlamaConfig = {
  llm: string,
  prompt: string
}
export type CallbackObj = {
  shouldContinue: () => boolean,
  take: (str: string) => void
}
export const runViaOllama = async (config: OlamaConfig, makeCallBackObj: () => CallbackObj) => {

  const obj = makeCallBackObj()

  const { llm, prompt } = config
  const url = `http://localhost:11434/api/generate`
  const data = {
    llm,
    prompt
  }
  let buffer = ""
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    },
  })
  // handle stream data
  const reader = resp.body.getReader()
  // read from binary 
  const decoder = new TextDecoder()
  const stream = new ReadableStream({
    start(controller) {
      // The following function handles each data chunk
      function push() {
        // "done" is a Boolean and value a "Uint8Array"
        reader.read().then(({ done, value }) => {
          // Is there no more data to read?
          if (done) {
            // Tell the browser that we have finished sending data
            controller.close();
            return;
          }
          // Get the data and send it to the browser via the controller

          controller.enqueue(value);



          // console.log("value", str);

          // Check chunks by logging to the console
          // console.log(done, value);
          push();
        });
      }
      push();
    }
  })
  // start it 
  const readable = stream.getReader()
  // while true, read the stream 
  while (obj.shouldContinue()) {
    const { done, value } = await readable.read()
    if (done) break
    const str = JSON.parse(decoder.decode(value, { stream: true })).response
    buffer += str
    obj.take(buffer)
  }




}