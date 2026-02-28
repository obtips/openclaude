---
title: "Claude Tool Use 完全指南"
description: "深入了解 Claude 的 Tool Use 功能，学习如何让 Claude 调用外部工具和 API，构建强大的 AI Agent。"
difficulty: "advanced"
tags: ["tool-use", "agent", "api", "高级"]
date: 2025-01-25
author: "OpenClaude Team"
---

# Claude Tool Use 完全指南

Tool Use 是 Claude API 最强大的功能之一，它允许 Claude 与外部工具和 API 交互，使你的 AI 应用能够执行实际操作。

## 什么是 Tool Use？

Tool Use 让 Claude 能够：
- 调用你定义的函数
- 访问外部 API
- 查询数据库
- 执行代码
- 与其他服务集成

## 基础概念

### 工具定义

首先，定义 Claude 可以使用的工具：

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const tools = [
  {
    name: "get_weather",
    description: "获取指定城市的天气信息",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市名称，例如：北京、上海"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "温度单位"
        }
      },
      required: ["city"]
    }
  },
  {
    name: "calculate",
    description: "执行数学计算",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "要计算的数学表达式"
        }
      },
      required: ["expression"]
    }
  }
]
```

### Tool Use 循环

```typescript
async function runToolUseConversation() {
  const messages = []

  while (true) {
    // 发送消息给 Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      tools: tools,
      messages: messages
    })

    // 处理响应
    let stopReason = response.stop_reason

    // 将助手回复添加到消息历史
    messages.push(...response.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })))

    // 检查是否需要使用工具
    const toolUseBlocks = response.content
      .filter(block => block.type === 'tool_use')

    if (toolUseBlocks.length === 0) {
      // 没有 tool_use，对话结束
      break
    }

    // 执行每个工具调用
    for (const block of toolUseBlocks) {
      const toolResult = await executeTool(block.name, block.input)

      // 添加工具结果到消息历史
      messages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(toolResult)
        }]
      })
    }

    if (stopReason === 'end_turn') {
      break
    }
  }

  return messages
}
```

## 实际示例

### 示例 1：数据库查询

```typescript
const databaseTools = [
  {
    name: "query_database",
    description: "执行 SQL 查询",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL 查询语句"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "list_tables",
    description: "列出数据库中的所有表",
    input_schema: {
      type: "object",
      properties: {}
    }
  }
]

async function executeTool(name: string, input: any) {
  switch (name) {
    case "query_database":
      // 执行查询
      const result = await db.query(input.query)
      return { rows: result.rows, count: result.rowCount }

    case "list_tables":
      const tables = await db.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
      return { tables: tables.rows.map(t => t.table_name) }

    default:
      return { error: "Unknown tool" }
  }
}
```

### 示例 2：API 调用

```typescript
const apiTools = [
  {
    name: "send_email",
    description: "发送电子邮件",
    input_schema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "收件人邮箱"
        },
        subject: {
          type: "string",
          description: "邮件主题"
        },
        body: {
          type: "string",
          description: "邮件正文"
        }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "create_calendar_event",
    description: "创建日历事件",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        start_time: { type: "string", format: "date-time" },
        end_time: { type: "string", format: "date-time" },
        attendees: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["title", "start_time", "end_time"]
    }
  }
]

async function executeTool(name: string, input: any) {
  switch (name) {
    case "send_email":
      const emailResponse = await fetch('https://api.emailprovider.com/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      return { success: emailResponse.ok }

    case "create_calendar_event":
      const calResponse = await fetch('https://api.calendar.com/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CALENDAR_API_KEY}`
        },
        body: JSON.stringify(input)
      })
      return await calResponse.json()
  }
}
```

### 示例 3：代码执行

```typescript
const codeTools = [
  {
    name: "execute_python",
    description: "在安全环境中执行 Python 代码",
    input_schema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "要执行的 Python 代码"
        }
      },
      required: ["code"]
    }
  },
  {
    name: "execute_javascript",
    description: "在 Node.js 环境中执行 JavaScript 代码",
    input_schema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "要执行的 JavaScript 代码"
        }
      },
      required: ["code"]
    }
  }
]

async function executeTool(name: string, input: any) {
  switch (name) {
    case "execute_python":
      // 使用 vm2 或类似沙箱
      const { PythonShell } = require('python-shell')
      return new Promise((resolve, reject) => {
        PythonShell.runString(input.code, null, (err, results) => {
          if (err) reject({ error: err.message })
          else resolve({ output: results.join('\n') })
        })
      })

    case "execute_javascript":
      // 使用 vm 模块创建沙箱
      const vm = require('vm')
      const context = { console, result: null }
      try {
        vm.runInNewContext(input.code + '\nresult = result || undefined', context, {
          timeout: 5000
        })
        return { output: JSON.stringify(context.result) }
      } catch (err) {
        return { error: err.message }
      }
  }
}
```

## 最佳实践

### 1. 安全性

```typescript
// 验证工具输入
function validateInput(toolName: string, input: any): boolean {
  if (toolName === "execute_code") {
    // 检查危险操作
    const dangerous = ['import os', 'subprocess', 'eval', 'exec']
    return !dangerous.some(d => input.code.includes(d))
  }
  return true
}

// 限制执行时间
async function safeExecute(fn: () => Promise<any>, timeout = 5000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ])
}
```

### 2. 错误处理

```typescript
async function executeTool(name: string, input: any) {
  try {
    // 输入验证
    if (!validateInput(name, input)) {
      return {
        error: "Invalid input",
        details: "Input contains disallowed content"
      }
    }

    // 执行工具
    const result = await safeExecute(
      () => toolImplementations[name](input)
    )

    return { success: true, result }

  } catch (error) {
    return {
      error: error.message,
      type: error.constructor.name
    }
  }
}
```

### 3. 上下文管理

```typescript
class ToolUseAgent {
  private messages: Array<any> = []
  private context: Map<string, any> = new Map()

  async chat(userMessage: string) {
    this.messages.push({
      role: "user",
      content: userMessage
    })

    const response = await this.processWithTools()

    this.messages.push({
      role: "assistant",
      content: response.content
    })

    return response
  }

  private async processWithTools() {
    // ... tool use 循环逻辑
  }

  // 在工具调用间保持状态
  setContext(key: string, value: any) {
    this.context.set(key, value)
  }

  getContext(key: string) {
    return this.context.get(key)
  }
}
```

### 4. 流式 Tool Use

```typescript
async function streamToolUse() {
  const stream = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    tools: tools,
    messages: messages,
    stream: true
  })

  for await (const event of stream) {
    if (event.type === 'content_block_start') {
      if (event.content_block.type === 'tool_use') {
        console.log(`Tool: ${event.content_block.name}`)
        console.log(`Input:`, event.content_block.input)
      }
    }

    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        process.stdout.write(event.delta.text)
      }
    }
  }
}
```

## 完整示例：AI 助手

```typescript
import Anthropic from '@anthropic-ai/sdk'

class PersonalAssistant {
  private anthropic: Anthropic
  private tools: any[]
  private messages: any[] = []

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey })
    this.tools = [
      {
        name: "get_time",
        description: "获取当前时间",
        input_schema: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "时区，例如 Asia/Shanghai"
            }
          }
        }
      },
      {
        name: "search_web",
        description: "搜索网络",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "搜索查询"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "create_note",
        description: "创建笔记",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" }
          },
          required: ["title", "content"]
        }
      }
    ]
  }

  async chat(userMessage: string) {
    this.messages.push({
      role: "user",
      content: userMessage
    })

    while (true) {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        tools: this.tools,
        messages: this.messages
      })

      const assistantMessage = {
        role: "assistant",
        content: response.content
      }
      this.messages.push(assistantMessage)

      // 检查是否有 tool_use
      const toolUseBlocks = response.content
        .filter((b: any) => b.type === 'tool_use')

      if (toolUseBlocks.length === 0) {
        // 返回最终回复
        const textBlocks = response.content
          .filter((b: any) => b.type === 'text')
        return textBlocks.map((b: any) => b.text).join('')
      }

      // 执行工具
      for (const block of toolUseBlocks) {
        const result = await this.executeTool(block.name, block.input)
        this.messages.push({
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result)
          }]
        })
      }
    }
  }

  private async executeTool(name: string, input: any) {
    switch (name) {
      case "get_time":
        return { time: new Date().toLocaleString('zh-CN', { timeZone: input.timezone || 'Asia/Shanghai' }) }
      case "search_web":
        // 实现搜索
        return { results: [] }
      case "create_note":
        // 保存笔记
        return { success: true, id: Date.now() }
      default:
        return { error: "Unknown tool" }
    }
  }
}

// 使用
const assistant = new PersonalAssistant(process.env.ANTHROPIC_API_KEY)
const response = await assistant.chat("帮我创建一个会议提醒")
console.log(response)
```

## 总结

Tool Use 的关键要点：

- ✅ **定义清晰** - 工具描述和参数要准确
- ✅ **安全第一** - 验证输入，限制执行
- ✅ **错误处理** - 优雅处理失败情况
- ✅ **状态管理** - 在多次工具调用间保持上下文
- ✅ **流式支持** - 提供实时反馈

通过 Tool Use，你可以构建真正强大的 AI Agent，让 Claude 与现实世界连接！
