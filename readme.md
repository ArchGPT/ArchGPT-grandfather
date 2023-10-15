First, make sure you have [Ollama](https://ollama.ai/) installed or `OPENAI_API_KEY=` in `.env`.`

Example of running ArchGPT v0.0.1: 

```typescript
import { initArchGPT } from "archgpt"

const archGPT = await initArchGPT(folder)

const ASTs = await archGPT.searchFiles("to do list")

const description = "allow users to assign a todo item to existing members in a team"

const result = await archGPT.runPrompt("CREATE_FILE",{ASTs, description,llm: "GPT4"})
```

Note: ArchGPT is still under active development. You can check out the other project we are working on:

> Insomnium: a fast local API testing tool that is privacy-focus and 100% local. For testing GraphQL, REST, WebSockets and gRPC (This is a fork of Kong/insomnia)
> 
> https://github.com/ArchGPT/insomnium 
> 
> ![GitHub Repo stars](https://img.shields.io/github/stars/archGPT/insomnium)

