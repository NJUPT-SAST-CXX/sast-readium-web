# SAST Readium Documentation Index

## Feature Documentation

### Performance Optimizations (P0 Critical Fixes - Commit 55ef6af)

- [Drawing Layer Performance Optimization](feature/drawing-layer-performance-optimization.md): Optimizes real-time drawing interactions by using refs, requestAnimationFrame throttling, and incremental canvas rendering to eliminate page freezing.
- [PDF Viewer Event Listener Optimization](feature/pdf-viewer-event-listener-optimization.md): Refactors event handlers to use getState() pattern, eliminating listener rebinding on state changes and reducing memory leaks.
- [AI Chat Streaming Update Optimization](feature/ai-chat-streaming-optimization.md): Implements 50ms debounce mechanism for AI chat streaming updates to batch chunks and reduce component re-renders by 80-90%.
- [Annotation History Memory Management](feature/annotation-history-memory-management.md): Enforces 50-step maximum undo/redo history limit to prevent unbounded memory growth during extended editing sessions.

### Performance Optimizations (P1 High Priority Fixes)

- [Touch Gestures Throttling Optimization](feature/touch-gestures-throttling-optimization.md): Uses requestAnimationFrame throttling and refs to handle high-frequency pinch-zoom and swipe events without blocking the main thread on mobile devices.
- [TTS Memory Leak Prevention](feature/tts-memory-leak-prevention.md): Properly cleans up Web Speech API utterance event handlers to prevent memory leaks from repeated text-to-speech operations.

### Performance Optimizations (P2 Medium Priority Fixes)

- [Annotation Layer Memoization Optimization](feature/annotation-layer-memoization-optimization.md): Memoizes filtered annotations and style callbacks to prevent unnecessary re-renders when parent components update but annotation data remains unchanged.
- [PDF Context Memoization Optimization](feature/pdf-context-memoization-optimization.md): Caches filtered annotations and mapped bookmarks for AI context to reduce computation overhead during rapid state changes.

### Core Features

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
