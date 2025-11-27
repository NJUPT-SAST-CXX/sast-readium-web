# AI Chat Panel Component

## 1. Purpose

Primary user-facing interface for AI-assisted PDF analysis. Renders conversation history with real-time message streaming, displays tool invocations with execution status, presents contextual suggestions, and manages input submission with error handling.

## 2. How It Works

### Layout Structure

Five-section vertical layout:
1. **Error Alert** (conditional): Dismissible error notification banner
2. **API Key Warning** (conditional): Appears when provider API key not configured
3. **Conversation Area**: Scrollable message history with auto-scroll-to-bottom
4. **Suggestions** (conditional): Horizontal chip buttons below last assistant message
5. **Input Area**: Textarea with send button and state indicators

### Message Rendering

- User messages: Simple text display
- Assistant messages: Prose-styled markdown with chain-of-thought detection
- Tool invocations: Collapsed `Tool` component for each `ToolUIPart` showing:
  - Tool name with status badge (Pending/Running/Completed/Error)
  - Input parameters in JSON format (expandable)
  - Output/error result in JSON format (expandable)

### Suggestion Generation

Suggestions passed from `chatStream()` onFinish callback. Currently generated based on:
- Current page context (e.g., "Summarize page 3")
- Selected text availability
- Annotation presence
- Navigation hints ("What's on the next page?")

Displayed as clickable buttons that resend suggestion text as new message.

### State Management

Uses `useAIChatStore()` for:
- `conversation.messages`: Render history
- `settings.provider/apiKeys`: Validation and provider display
- `isLoading`: Input disable state and loading spinner
- `error`: Error alert visibility and content

Uses `useAIChat()` hook for:
- `sendMessage()`: Submit user input
- `isLoading/error`: UI state feedback
- `clearError()`: Dismiss error alert

### Auto-scroll Implementation

`useEffect` monitors messages array and scrolls conversation container to bottom when new messages arrive.

## 3. Relevant Code Modules

- `/components/ai-sidebar/ai-chat-panel.tsx`: Main panel component
- `/components/ai-elements/message.tsx`: Message container and styling
- `/components/ai-elements/tool.tsx`: Tool invocation rendering
- `/components/ai-elements/suggestion.tsx`: Suggestion chips
- `/hooks/use-ai-chat.ts`: Chat operations hook
- `/lib/ai-chat-store.ts`: Store state access

## 4. Attention

- Conversation must exist before adding messages (createConversation called on first send)
- Tool invocations default to collapsed state (`defaultOpen={false}`)
- Suggestions only show when last message is from assistant (prevents user suggestion display)
- Input disabled when no API key configured (prevents confusing errors)
- Long messages may cause scroll performance issues in large conversations
