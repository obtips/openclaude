---
title: 'Guide for Claude API'
description: 'an intro'
date: 2026-03-01T12:00:49.255Z
author: 'OpenClaude Team'
tags: ['api', '入门', '基础']
category: '技术'
difficulty: 'intermediate'
---








# Claude API 入门

欢迎来到 Claude API 入门教程！本教程将带你了解如何开始使用 Anthropic 的 Claude API。

## 什么是 Claude API？

Claude API 是 Anthropic 提供的一个强大接口，让你能够在自己的应用中集成 Claude AI 的能力。Claude 是一个擅长分析、写作和编程的 AI 助手。

## 准备工作

### 1. 获取 API Key

首先，你需要在 [Anthropic Console](https://console.anthropic.com/) 注册账号并获取 API Key。

### 2. 安装 SDK

```bash
# 使用 npm
npm install @anthropic-ai/sdk

# 使用 yarn
yarn add @anthropic-ai/sdk

# 使用 pnpm
pnpm add @anthropic-ai/sdk
```

## 你的第一个 API 调用

### 基础示例

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // 默认从环境变量读取
})

async function main() {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: "你好，Claude！请介绍一下你自己。"
      }
    ]
  })

  console.log(message.content[0].text)
}

main()
```

### 流式响应

对于更好的用户体验，你可以使用流式响应：

```typescript
async function streamExample() {
  const stream = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: "写一首关于编程的诗"
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

## 消息结构

Claude API 使用消息格式进行交互：

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: "你是一个友好的编程助手。", // 系统提示
  messages: [
    {
      role: "user",
      content: "什么是 TypeScript？"
    },
    {
      role: "assistant", // 可选：包含之前的助手回复
      content: "TypeScript 是 JavaScript 的超集..."
    },
    {
      role: "user",
      content: "能给我一个例子吗？"
    }
  ]
})
```

## 多模态支持

Claude 3.5 支持图片输入：

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      {
        type: "text",
        text: "这张图片里有什么？"
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

## 最佳实践

### 1. 错误处理

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

### 2. 设置合理的 max_tokens

根据你的需求设置合适的 `max_tokens` 值，避免不必要的成本。

### 3. 使用系统提示

系统提示可以帮助你更好地控制 Claude 的行为和输出风格。

### 4. 环境变量管理

**永远不要**在代码中硬编码 API Key。使用环境变量：

```bash
# .env 文件
ANTHROPIC_API_KEY=your_api_key_here
```

## 可用模型

| 模型 | 用途 |
|------|------|
| claude-3-5-sonnet-20241022 | 通用，平衡性能和成本 |
| claude-3-5-haiku-20241022 | 快速响应，轻量任务 |
| claude-3-opus-20240229 | 最强性能，复杂任务 |

## 下一步

现在你已经掌握了 Claude API 的基础知识，可以尝试：

- [ ] 构建一个聊天应用
- [ ] 创建文档分析工具
- [ ] 开发代码助手

祝你使用愉快！
