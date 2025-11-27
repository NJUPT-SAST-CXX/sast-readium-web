# SAST Readium Documentation Index

## Feature Documentation

- [AI Integration with SDK Tool Calling](feature/ai-integration.md): Core AI service architecture, tool calling support, and multimodal message handling for PDF analysis and document interaction.
- [AI Chat Panel Component](feature/ai-chat-panel.md): User-facing chat interface with message rendering, tool invocation display, and suggestion management.
- [AI State Management](feature/ai-state-management.md): Zustand-based store for conversations, settings, PDF context, and chat state persistence.
- [AI API Key Security and Storage](feature/ai-api-key-security.md): Secure API key encryption using Web Crypto API in browser mode and OS credential management in Tauri desktop mode.
- [AI Components Library](feature/ai-components-library.md): Reusable UI components for message display, tool rendering, suggestions, and confirmation workflows.
- [Mobile and Responsive Design](feature/mobile-responsive-design.md): Mobile-first responsive architecture including bottom sheet drawers, adaptive dialogs, touch gestures, context menus, and breakpoint-based component switching.

## Development Workflow

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** for automatic code quality checks:

- **ESLint**: Auto-fixes linting issues on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
- **Prettier**: Formats staged files (JS/TS, JSON, Markdown, YAML, CSS)

Hooks are automatically installed via `pnpm install`.

### Available Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `pnpm dev`           | Start development server     |
| `pnpm build`         | Build for production         |
| `pnpm lint`          | Run ESLint                   |
| `pnpm lint:fix`      | Run ESLint with auto-fix     |
| `pnpm typecheck`     | Run TypeScript type checking |
| `pnpm format`        | Format code with Prettier    |
| `pnpm test`          | Run Jest tests               |
| `pnpm test:coverage` | Generate coverage report     |
| `pnpm tauri dev`     | Run desktop app              |

## Standard Operating Procedures

(None currently documented)

## Architecture Notes

### AI Feature Architecture Overview

The AI feature integrates the Vercel AI SDK (`ai` package) with a Zustand store for state management. The system supports multiple AI providers (OpenAI, Anthropic, custom OpenAI-compatible) with tool calling capabilities including:

- **PDF Tools**: Summarization, translation, concept explanation, information search, and page structure analysis
- **Streaming Support**: Real-time message streaming with tool invocation tracking
- **Multimodal Support**: Image attachments and vision-capable model selection
- **Context Awareness**: PDF context integration including page text, annotations, bookmarks, and selected text
- **Secure API Key Storage**: Encrypted storage in browser mode (Web Crypto API AES-GCM) and OS credential management in Tauri desktop mode
- **Custom Providers**: Support for OpenAI-compatible API endpoints with configurable base URLs

### Key Module Connections

- `/lib/ai-service.ts`: Core AI service with streaming, tool definitions, and API integration
- `/lib/ai-chat-store.ts`: Zustand store managing conversations, settings, and PDF context
- `/hooks/use-ai-chat.ts`: React hook for chat operations and streaming management
- `/components/ai-sidebar/`: UI components for the AI chat interface
- `/components/ai-elements/`: Reusable elements for message display and tool rendering
