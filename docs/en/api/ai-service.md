# AI Service API

The AI Service (`lib/ai-service.ts`) provides AI text generation, tool calling, and streaming capabilities using the Vercel AI SDK.

## Import

```typescript
import {
  streamChat,
  generateChat,
  type Message,
  type ChatOptions,
  type AIServiceConfig,
} from "@/lib/ai-service";
```

## Types

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

## Functions

### streamChat

Streams a chat response with real-time updates.

```typescript
async function streamChat(
  config: AIServiceConfig,
  options: ChatOptions
): Promise<StreamResult>;
```

**Parameters:**

- `config` - AI provider configuration
- `options` - Chat options including messages and callbacks

**Returns:**

```typescript
interface StreamResult {
  text: string;
  toolInvocations?: SimpleToolInvocation[];
  suggestions?: string[];
  usage?: LanguageModelUsage;
}
```

**Example:**

```typescript
const config: AIServiceConfig = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: "sk-...",
  temperature: 0.7,
};

const result = await streamChat(config, {
  messages: [{ id: "1", role: "user", content: "Summarize this page" }],
  pdfContext: {
    currentPage: 1,
    totalPages: 10,
    pageContent: "...",
  },
  onUpdate: (text, tools) => {
    console.log("Streaming:", text);
  },
  onFinish: (text, tools, suggestions, usage) => {
    console.log("Complete:", text);
  },
  onError: (error) => {
    console.error("Error:", error);
  },
});
```

### generateChat

Generates a complete response without streaming.

```typescript
async function generateChat(
  config: AIServiceConfig,
  options: Omit<ChatOptions, "onUpdate">
): Promise<GenerateResult>;
```

**Example:**

```typescript
const result = await generateChat(config, {
  messages: [
    { id: "1", role: "user", content: "What is this document about?" },
  ],
});

console.log(result.text);
```

## Built-in Tools

The AI service includes PDF-specific tools:

### search_document

Searches for text in the PDF document.

```typescript
{
  name: "search_document",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
}
```

### navigate_to_page

Navigates to a specific page.

```typescript
{
  name: "navigate_to_page",
  parameters: z.object({
    page: z.number().describe("Page number"),
  }),
}
```

### get_page_content

Retrieves content from a specific page.

```typescript
{
  name: "get_page_content",
  parameters: z.object({
    page: z.number().describe("Page number"),
  }),
}
```

### highlight_text

Adds a highlight annotation.

```typescript
{
  name: "highlight_text",
  parameters: z.object({
    text: z.string().describe("Text to highlight"),
    color: z.string().optional().describe("Highlight color"),
  }),
}
```

### add_bookmark

Creates a bookmark at the current page.

```typescript
{
  name: "add_bookmark",
  parameters: z.object({
    title: z.string().describe("Bookmark title"),
    page: z.number().optional().describe("Page number"),
  }),
}
```

## MCP Integration

Connect to MCP servers for additional tools:

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

## Error Handling

```typescript
try {
  const result = await streamChat(config, {
    messages,
    onError: (error) => {
      // Handle streaming errors
      console.error("Stream error:", error);
    },
  });
} catch (error) {
  // Handle setup errors
  console.error("Setup error:", error);
}
```

## Abort Requests

Cancel ongoing requests:

```typescript
const controller = new AbortController();

streamChat(config, {
  messages,
  abortSignal: controller.signal,
});

// Cancel the request
controller.abort();
```

## Provider Configuration

### OpenAI

```typescript
const config: AIServiceConfig = {
  provider: "openai",
  model: "gpt-4o", // or gpt-4, gpt-3.5-turbo
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

### Custom Provider

```typescript
const config: AIServiceConfig = {
  provider: "custom",
  model: "my-model",
  apiKey: "...",
  customProvider: {
    id: "my-provider",
    name: "My Provider",
    baseUrl: "https://api.example.com/v1",
    models: ["my-model"],
  },
};
```
