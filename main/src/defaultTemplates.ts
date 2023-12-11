import _ from "lodash"
import { PromptConfig } from "./index"

const gpt4ReactTailwind = ({ json, description }: { json: any, description: string }): PromptConfig => ({
  basedOn: [],
  description: "",
  llm: "gpt-4",
  prompt: [
    { role: 'system', content: "" + JSON.stringify(json) },
    {
      role: 'user', content:
        "Below is a file defining a React component using typescript and tailwind to display the JSON nicely. " + description
    },
    {
      role: "assistant", content:
        `import React from 'react'

// we will try our best to use default tailwind to create a gothic style
export const GothicAttemptView = (props) => {`
    }

  ],
  gptConfig: {
    max_tokens: 100
  }
})


export const defaultTemplates = {
  "gpt4-react-tailwind": gpt4ReactTailwind
}