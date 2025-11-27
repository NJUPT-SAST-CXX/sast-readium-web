# AI Integration with SDK Tool Calling

## 1. Purpose

Provides core AI service infrastructure enabling PDF analysis and document interaction through the Vercel AI SDK. Supports streaming text responses, tool calling with execution, multimodal messages, and context-aware analysis with multiple AI providers (OpenAI, Anthropic, and custom OpenAI-compatible providers).

## 2. How It Works

### Service Configuration

- `AIServiceConfig`: Provider, model, API key, temperature, maxTokens, systemPrompt
- Supports "openai" and "anthropic" providers via `@ai-sdk/openai` and `@ai-sdk/anthropic`
- Supports custom OpenAI-compatible providers with configurable base URLs
- Default system prompt tailored for PDF document analysis with page referencing

### Message Handling

**Core Message Type** (`lib/ai-chat-store.ts`):
```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  toolInvocations?: ToolUIPart[];  // AI SDK tool tracking
  suggestions?: string[];           // Contextual action suggestions
}
```

**Multimodal Support**: Messages support `experimental_attachments` for image content with vision-capable models.

### Tool Calling System

Five PDF-focused tools defined in `getPDFTools()`:

1. **summarizeContent**: Summarize text with length options (short/medium/long)
2. **translateText**: Translate with optional formatting preservation
3. **explainConcept**: Explain terms at complexity levels (simple/intermediate/advanced)
4. **findInformation**: Search and cite information with page numbers
5. **analyzePageStructure**: Analyze PDF page layout and annotation counts

**Tool Execution Flow**:
- Tools declared with Zod schemas for parameter validation
- Execute handlers return structured data (partial results trigger AI analysis)
- Tool invocations tracked in real-time via `ToolUIPart` objects
- Up to 5 sequential tool calls per response (`maxSteps: 5`)

### Streaming Implementation

`chatStream()` function processes streaming chunks:
- **text-delta**: Accumulate and emit text content
- **tool-call**: Create `ToolUIPart` with `state: "input-available"`
- **tool-result**: Update invocation state to `output-available`
- **onFinish**: Generate suggestions, emit complete message with toolInvocations

Tool States: "input-streaming" → "input-available" → "output-available" / "output-error"

### PDF Context Integration

System prompt automatically enriched with:
- File name and page information
- Selected text from user highlight
- Current page content (first 4000 chars)
- User annotations with types
- User bookmarks with page numbers
- Page images for vision-capable models

### Secure API Key Handling

API keys are managed securely through `tauri-bridge-ai.ts`:
- **Browser Mode**: Keys encrypted with AES-GCM before localStorage storage
- **Desktop Mode**: Keys stored in OS credential managers (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- **Automatic Migration**: Old unencrypted keys automatically encrypted on first access
- **Type Support**: API keys support built-in providers ("openai", "anthropic") and custom provider IDs

## 3. Relevant Code Modules

- `/lib/ai-service.ts`: Main service module with `chatStream()`, `chat()`, `getPDFTools()`
- `/lib/ai-chat-store.ts`: Type definitions (Message, PDFContext, AISettings, AIModel, CustomProvider)
- `/hooks/use-ai-chat.ts`: React hook binding store to streaming service
- `/lib/tauri-bridge-ai.ts`: Secure API key storage bridging (encryption and OS credential management)
- `/components/ai-sidebar/ai-settings-panel.tsx`: Settings UI for API key and provider configuration

## 4. Attention

- API keys not persisted to localStorage in plaintext; encrypted in browser mode, secured via OS keychains in desktop mode
- Tool execution is simulated in tool handler; actual AI performs the work
- Context prompt token cost increases with document size (4000 char page limit applied)
- Vision models require `supportsVision: true` flag in model definition
- Streaming cancellation not yet implemented (maxSteps safeguard prevents infinite loops)
- Custom provider API keys stored and retrieved using provider ID (not provider name)
