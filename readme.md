First, make sure you have [Ollama](https://ollama.ai/) installed or `OPENAI_API_KEY=` in `.env`.`

Example of running ArchGPT v0.0.1: 

```typescript
import { initArchGPT } from "archgpt"

const archGPT = await initArchGPT(folder)

const ASTs = await archGPT.searchFiles("to do list")

const description = "allow users to assign a todo item to existing members in a team"

const result = await archGPT.runPrompt("CREATE_FILE",{ASTs, description,llm: "GPT4"})
```



### coming soon: 

1. [Insomnium](https://github.com/ArchGPT/insomnium/) Integration: https://github.com/ArchGPT/insomnium/discussions/13 to have first-class support for LLMs

2. upload to npm & add API documentations

3. ArchGPT GUI: 

![HN](https://github.com/ArchGPT/ArchGPT/blob/main/gui.png?raw=true)

