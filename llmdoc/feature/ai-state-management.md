# AI State Management

## 1. Purpose

Zustand-based centralized store (`useAIChatStore`) managing AI chat conversations, provider settings, API keys, and PDF document context. Provides real-time state updates for the entire AI feature system with selective localStorage persistence (excluding sensitive API keys).

## 2. How It Works

### Core State Slices

**UI State**:
- `isSidebarOpen`: Conversation sidebar visibility
- `isLoading`: Global loading state during API requests
- `error`: Current error message string or null

**Conversation Management**:
- `conversations`: Map of conversation IDs to Conversation objects
- `currentConversationId`: Active conversation ID (null if none)

**Settings**:
- `provider`: Current AI provider ("openai" | "anthropic" | "custom")
- `customProviderId`: ID of custom provider when provider === "custom"
- `model`: Selected model ID (e.g., "gpt-4o-mini")
- `temperature`: LLM temperature (default 0.7)
- `maxTokens`: Response token limit (default 4096)
- `apiKeys`: Provider-indexed API key storage (not persisted to localStorage)
- `systemPrompt`: Base system prompt for all requests
- `includePDFContext`: Toggle PDF context inclusion in prompts
- `customProviders`: Array of custom provider configurations
- `mcpServers`: Array of Model Context Protocol server configurations

**PDF Context**:
- `fileName`, `currentPage`, `totalPages`: Document metadata
- `pageText`: Extracted text from current page
- `selectedText`: User-highlighted text
- `pageImages`: Array of PDFPageImage objects for vision models
- `annotations`: Array of annotation metadata by page
- `bookmarks`: Array of user-created bookmarks

### Conversation Structure

```typescript
interface Conversation {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  messages: Message[];           // Conversation history
  createdAt: number;            // Unix timestamp
  updatedAt: number;            // Last modified timestamp
  pdfFileName?: string;         // Associated PDF name
  pdfPath?: string;             // File path reference
}
```

### State Actions

**UI Operations**:
- `toggleSidebar()`: Toggle sidebar visibility
- `setSidebarOpen(open)`: Set explicit sidebar state
- `setLoading(loading)`: Update loading indicator
- `setError(error)`: Set or clear error message

**Conversation Operations**:
- `createConversation(title?)`: Create new conversation with auto-title from PDF context
- `deleteConversation(id)`: Delete conversation and unset if current
- `setCurrentConversation(id)`: Switch active conversation
- `updateConversationTitle(id, title)`: Rename conversation
- `addMessage(message)`: Append message to current conversation
- `updateMessage(messageId, updates)`: Modify message in-place (for streaming updates)
- `clearMessages()`: Empty current conversation messages
- `deleteMessage(messageId)`: Remove single message

**Settings Operations**:
- `updateSettings(partial)`: Merge settings update
- `setAPIKey(provider: string, key: string)`: Update provider-specific API key (supports "openai", "anthropic", and custom provider IDs)

**PDF Context Operations**:
- `setPDFContext(context)`: Replace entire PDF context
- `updatePDFContext(updates)`: Merge partial PDF context updates

**Custom Provider Operations**:
- `addCustomProvider(provider)`: Create new custom provider configuration
- `updateCustomProvider(id, updates)`: Modify custom provider settings
- `deleteCustomProvider(id)`: Remove custom provider
- `addPresetProvider(presetIndex)`: Add provider from preset templates

**Helper Functions**:
- `getCurrentConversation()`: Fetch current conversation object
- `getConversationList()`: Return all conversations sorted by updatedAt
- `hasAPIKey(provider)`: Check if API key configured
- `getProviderAPIKey(providerId?)`: Get API key for specified provider

### Persistence Strategy

localStorage key: `"ai-chat-storage"`

**Persisted** (via partialize):
- Conversations (full history)
- Settings (including custom providers, MCP configs, but excluding API keys for security)
- Current conversation ID
- Prompt templates and quick commands

**Not Persisted**:
- UI state (isLoading, error, isSidebarOpen)
- API keys (cleared on hydration; retrieved from secure storage via tauri-bridge-ai)
- PDF context (session-only, updates on file selection)

## 3. Relevant Code Modules

- `/lib/ai-chat-store.ts`: Zustand store implementation
- `/lib/ai-chat-store.ts`: Type exports (Message, Conversation, PDFContext, AISettings, CustomProvider)
- `/lib/tauri-bridge-ai.ts`: Secure API key storage and retrieval
- `/hooks/use-ai-chat.ts`: Hook consuming store state
- `/components/ai-sidebar/ai-settings-panel.tsx`: Settings UI with custom provider management

## 4. Attention

- Updating messages requires `currentConversationId` to be set; no-op if null or conversation not found
- API keys not persisted to localStorage; must be retrieved from secure storage on app load
- Custom provider selection uses unique compound values (`custom:${providerId}`) in UI layers to distinguish from built-in providers
- Conversation title auto-generated from PDF filename; user can override via updateConversationTitle
- updateMessage supports partial updates; toolInvocations and suggestions merged with existing content
- currentConversationId set to null when active conversation deleted; auto-creates new on next message send
