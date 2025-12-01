# AI Service API

AI Service (`lib/ai-service.ts`) 使用 Vercel AI SDK 提供 AI 文本生成、工具调用和流式传输功能。

## 导入

```typescript
import {
  streamChat,
  generateChat,
  type Message,
  type ChatOptions,
  type AIServiceConfig,
} from "@/lib/ai-service";
```

## 类型

### Message

```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  toolInvocations?: SimpleToolInvocation[];
  suggestions?: string[];
  usage?: LanguageModelUsage;
  experimental_attachments?: Array<{
    name?: string;
    contentType?: string;
    url?: string;
  }>;
}
```

### SimpleToolInvocation

```typescript
interface SimpleToolInvocation {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  state: "call" | "result" | "error";
}
```

### AIServiceConfig

```typescript
interface AIServiceConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  customProvider?: CustomProvider;
}
```

### ChatOptions

```typescript
interface ChatOptions {
  messages: Message[];
  pdfContext?: PDFContext | null;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  enableMultiStep?: boolean;
  maxSteps?: number;
  mcpServers?: MCPServerConfig[];
  onUpdate?: (text: string, toolInvocations?: SimpleToolInvocation[]) => void;
  onFinish?: (
    text: string,
    toolInvocations?: SimpleToolInvocation[],
    suggestions?: string[],
    usage?: LanguageModelUsage
  ) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolName: string, args: unknown) => void;
  onStepFinish?: (step: StepResult) => void;
  abortSignal?: AbortSignal;
}
```

### PDFContext

```typescript
interface PDFContext {
  currentPage: number;
  totalPages: number;
  pageContent?: string;
  selectedText?: string;
  documentTitle?: string;
  documentAuthor?: string;
}
```

## 函数

### streamChat

流式传输聊天响应，实时更新。

```typescript
async function streamChat(
  config: AIServiceConfig,
  options: ChatOptions
): Promise<StreamResult>;
```

**参数：**

- `config` - AI 提供商配置
- `options` - 聊天选项，包括消息和回调

**返回：**

```typescript
interface StreamResult {
  text: string;
  toolInvocations?: SimpleToolInvocation[];
  suggestions?: string[];
  usage?: LanguageModelUsage;
}
```

**示例：**

```typescript
const config: AIServiceConfig = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: "sk-...",
  temperature: 0.7,
};

const result = await streamChat(config, {
  messages: [{ id: "1", role: "user", content: "总结这一页" }],
  pdfContext: {
    currentPage: 1,
    totalPages: 10,
    pageContent: "...",
  },
  onUpdate: (text, tools) => {
    console.log("流式传输:", text);
  },
  onFinish: (text, tools, suggestions, usage) => {
    console.log("完成:", text);
  },
  onError: (error) => {
    console.error("错误:", error);
  },
});
```

### generateChat

生成完整响应，不使用流式传输。

```typescript
async function generateChat(
  config: AIServiceConfig,
  options: Omit<ChatOptions, "onUpdate">
): Promise<GenerateResult>;
```

**示例：**

```typescript
const result = await generateChat(config, {
  messages: [{ id: "1", role: "user", content: "这个文档是关于什么的？" }],
});

console.log(result.text);
```

## 内置工具

AI 服务包含 PDF 特定工具：

### search_document

在 PDF 文档中搜索文本。

```typescript
{
  name: "search_document",
  parameters: z.object({
    query: z.string().describe("搜索查询"),
  }),
}
```

### navigate_to_page

导航到特定页面。

```typescript
{
  name: "navigate_to_page",
  parameters: z.object({
    page: z.number().describe("页码"),
  }),
}
```

### get_page_content

获取特定页面的内容。

```typescript
{
  name: "get_page_content",
  parameters: z.object({
    page: z.number().describe("页码"),
  }),
}
```

### highlight_text

添加高亮注释。

```typescript
{
  name: "highlight_text",
  parameters: z.object({
    text: z.string().describe("要高亮的文本"),
    color: z.string().optional().describe("高亮颜色"),
  }),
}
```

### add_bookmark

在当前页面创建书签。

```typescript
{
  name: "add_bookmark",
  parameters: z.object({
    title: z.string().describe("书签标题"),
    page: z.number().optional().describe("页码"),
  }),
}
```

## MCP 集成

连接到 MCP 服务器获取额外工具：

```typescript
import { getAllMCPTools, type MCPServerConfig } from "@/lib/mcp-client";

const mcpConfig: MCPServerConfig = {
  name: "my-server",
  command: "npx",
  args: ["-y", "@my/mcp-server"],
  env: {},
};

const result = await streamChat(config, {
  messages,
  mcpServers: [mcpConfig],
  enableTools: true,
});
```

## 错误处理

```typescript
try {
  const result = await streamChat(config, {
    messages,
    onError: (error) => {
      // 处理流式传输错误
      console.error("流错误:", error);
    },
  });
} catch (error) {
  // 处理设置错误
  console.error("设置错误:", error);
}
```

## 取消请求

取消正在进行的请求：

```typescript
const controller = new AbortController();

streamChat(config, {
  messages,
  abortSignal: controller.signal,
});

// 取消请求
controller.abort();
```

## 提供商配置

### OpenAI

```typescript
const config: AIServiceConfig = {
  provider: "openai",
  model: "gpt-4o", // 或 gpt-4, gpt-3.5-turbo
  apiKey: process.env.OPENAI_API_KEY!,
};
```

### Anthropic

```typescript
const config: AIServiceConfig = {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY!,
};
```

### 自定义提供商

```typescript
const config: AIServiceConfig = {
  provider: "custom",
  model: "my-model",
  apiKey: "...",
  customProvider: {
    id: "my-provider",
    name: "我的提供商",
    baseUrl: "https://api.example.com/v1",
    models: ["my-model"],
  },
};
```
