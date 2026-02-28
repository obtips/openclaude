---
title: "Getting Started with Claude API"
description: "Learn how to call the Claude API to build intelligent applications, including environment setup, request examples, and best practices."
difficulty: "beginner"
tags: ["api", "getting-started", "basics"]
date: 2025-01-15
author: "OpenClaude Team"
---

# Getting Started with Claude API

Welcome to the Claude API getting started tutorial! This guide will show you how to start using Anthropic's Claude API.

## What is Claude API?

Claude API is a powerful interface provided by Anthropic that lets you integrate Claude AI capabilities into your own applications. Claude is an AI assistant skilled at analysis, writing, and programming.

## Prerequisites

### 1. Get API Key

First, you need to sign up at [Anthropic Console](https://console.anthropic.com/) and get your API Key.

### 2. Install SDK

```bash
# Using npm
npm install @anthropic-ai/sdk

# Using yarn
yarn add @anthropic-ai/sdk

# Using pnpm
pnpm add @anthropic-ai/sdk
```

## Your First API Call

### Basic Example

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Reads from environment variable by default
})

async function main() {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: "Hello, Claude! Please introduce yourself."
      }
    ]
  })

  console.log(message.content[0].text)
}

main()
```

### Streaming Response

For better user experience, you can use streaming responses:

```typescript
async function streamExample() {
  const stream = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: "Write a poem about programming"
    }],
    stream: true
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      process.stdout.write(event.delta.text)
    }
  }
}
```

## Message Structure

Claude API uses message format for interaction:

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: "You are a friendly programming assistant.", // System prompt
  messages: [
    {
      role: "user",
      content: "What is TypeScript?"
    },
    {
      role: "assistant", // Optional: include previous assistant responses
      content: "TypeScript is a superset of JavaScript..."
    },
    {
      role: "user",
      content: "Can you give me an example?"
    }
  ]
})
```

## Multimodal Support

Claude 3.5 supports image input:

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      {
        type: "text",
        text: "What's in this image?"
      },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: "base64_encoded_image_data..."
        }
      }
    ]
  }]
})
```

## Best Practices

### 1. Error Handling

```typescript
try {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello!" }]
  })
} catch (error) {
  if (error instanceof Anthropic.Error) {
    console.error(error.status)
    console.error(error.message)
  } else {
    console.error(error)
  }
}
```

### 2. Set Reasonable max_tokens

Set appropriate `max_tokens` value based on your needs to avoid unnecessary costs.

### 3. Use System Prompts

System prompts help you better control Claude's behavior and output style.

### 4. Environment Variable Management

**Never** hardcode API Keys in your code. Use environment variables:

```bash
# .env file
ANTHROPIC_API_KEY=your_api_key_here
```

## Available Models

| Model | Use Case |
|-------|----------|
| claude-3-5-sonnet-20241022 | General purpose, balanced performance and cost |
| claude-3-5-haiku-20241022 | Fast response, lightweight tasks |
| claude-3-opus-20240229 | Highest performance, complex tasks |

## Next Steps

Now that you've mastered the basics of Claude API, you can try:

- [ ] Build a chat application
- [ ] Create a document analysis tool
- [ ] Develop a code assistant

Happy coding!
