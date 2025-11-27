# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SAST Readium** is a modern, feature-rich PDF reader and annotation application built for performance and usability. It combines web and desktop capabilities in a single codebase.

**Core Technologies:**

- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS v4
- **Desktop Framework**: Tauri 2.9 for cross-platform desktop (Windows, macOS, Linux)
- **PDF Rendering**: PDF.js (pdfjs-dist) with react-pdf
- **UI Components**: shadcn/ui with Radix UI primitives and Lucide icons
- **State Management**: Zustand with persistence middleware
- **Internationalization**: react-i18next with language detection
- **Archive Support**: jszip and node-unrar-js for ZIP/RAR extraction

## Development Commands

### Frontend Development

```bash
# Start Next.js development server (web mode)
pnpm dev

# Build for production (static export to out/)
pnpm build

# Lint code
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# TypeScript type checking
pnpm typecheck

# Format code with Prettier
pnpm format

# Check formatting without modifying
pnpm format:check

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage report
pnpm test:coverage
```

### Tauri Desktop App Development

```bash
# Run Tauri development mode (starts both frontend and desktop app)
pnpm tauri dev

# Build Tauri desktop application for current platform
pnpm tauri build

# Show Tauri environment info
pnpm tauri info
```

### Testing

- Uses **Jest** with React Testing Library and jsdom environment
- Test files: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Coverage thresholds: 70% lines/statements, 60% branches/functions
- Mocks for pdfjs-dist and CSS imports configured in jest.config.ts
- To run a single test file: `pnpm test <file-path>`

## Architecture

### Application Structure

```text
sast-readium-web/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with i18n provider
│   ├── page.tsx                 # Main app page (PDF viewer + welcome)
│   └── about/page.tsx           # About page with runtime info
├── components/
│   ├── pdf-viewer/              # PDF viewer components
│   │   ├── pdf-viewer.tsx       # Main PDF viewer component
│   │   ├── pdf-toolbar.tsx      # Desktop toolbar
│   │   ├── pdf-mobile-toolbar.tsx # Mobile toolbar
│   │   ├── pdf-annotation-layer.tsx # Annotation rendering
│   │   ├── pdf-drawing-layer.tsx    # Drawing tools
│   │   ├── pdf-outline.tsx      # PDF table of contents
│   │   ├── pdf-bookmarks.tsx    # User bookmarks
│   │   └── pdf-tts-reader.tsx   # Text-to-speech reader
│   ├── ui/                      # shadcn/ui components
│   ├── providers/
│   │   └── i18n-provider.tsx    # i18n setup
│   ├── welcome-page/            # Welcome screen
│   ├── splash-screen.tsx        # Loading screen
│   └── theme-manager.tsx        # Theme switcher
├── lib/
│   ├── pdf-store.ts             # Zustand store for PDF state
│   ├── pdf-utils.ts             # PDF.js utilities
│   ├── tauri-bridge.ts          # Tauri command wrappers
│   ├── archive-utils.ts         # ZIP/RAR extraction
│   ├── notification-service.ts  # Tauri notifications
│   ├── update-service.ts        # Auto-update service
│   └── i18n.ts                  # i18next configuration
├── hooks/
│   ├── use-touch-gestures.ts    # Touch gesture handling
│   ├── use-tts.ts               # Text-to-speech hook
│   └── use-device-orientation.ts # Orientation detection
├── locales/
│   ├── en/translation.json      # English translations
│   └── zh/translation.json      # Chinese translations
├── src-tauri/                   # Rust backend
│   ├── src/lib.rs               # Custom Tauri commands
│   ├── src/main.rs              # Entry point
│   └── tauri.conf.json          # Tauri configuration
└── public/                      # Static assets
```

### State Management (Zustand)

The application uses a centralized Zustand store in [lib/pdf-store.ts](lib/pdf-store.ts):

**Key State Slices:**

- **Document State**: Current page, zoom, rotation, view mode, fit mode
- **UI State**: Fullscreen, dark mode, theme (light/dark/sepia/auto), sidebar visibility
- **Annotations**: Highlights, comments, drawings, shapes, stamps with undo/redo history
- **Bookmarks**: User-created bookmarks with timestamps
- **Search**: Search query, results, case sensitivity
- **TTS**: Text-to-speech settings (rate, volume, reading state)
- **Recent Files**: Persistent history of opened PDFs

**Persistence**: Uses Zustand's persist middleware to save preferences and recent files to localStorage.

### PDF Features

1. **Viewing**:
   - Multiple view modes: Single page, continuous scroll, facing pages
   - Fit modes: Page fit, width fit, auto fit
   - Zoom controls (50%-500%)
   - Page rotation (0°, 90°, 180°, 270°)
   - Dark mode, sepia mode, presentation mode

2. **Annotations**:
   - Highlighting with color picker
   - Text comments
   - Drawing tools with variable stroke width
   - Shapes (rectangles, circles, arrows)
   - Stamps and signatures
   - Undo/redo support with history tracking

3. **Navigation**:
   - Thumbnail sidebar with drag-and-drop page reordering
   - Outline/table of contents
   - Bookmarks with custom titles
   - Search with highlighting
   - Keyboard shortcuts

4. **Advanced**:
   - Text-to-speech reading with adjustable speed
   - Metadata viewing and editing
   - PDF watermarking
   - File operations (rename, delete, reveal in file manager)
   - Multi-file tab support

5. **Archive Support**:
   - Extract and read PDFs from ZIP archives
   - RAR archive extraction support

### Tauri Custom Commands

Custom Rust commands in [src-tauri/src/lib.rs](src-tauri/src/lib.rs):

- `get_system_info()` - Returns OS and architecture
- `get_app_runtime_info()` - Returns app version, Tauri version, paths
- `reveal_in_file_manager(path)` - Opens file location in system file manager
- `rename_file(path, new_name)` - Renames a file
- `delete_file(path)` - Deletes a file

**Tauri Plugins Used:**

- `tauri-plugin-updater` - Auto-update functionality
- `tauri-plugin-notification` - System notifications
- `tauri-plugin-dialog` - Native file dialogs
- `tauri-plugin-fs` - File system access

**Accessing Tauri Commands**: Use the tauri-bridge.ts wrapper for safe invocation that handles browser/desktop detection.

### Internationalization (i18n)

- **Framework**: react-i18next with browser language detection
- **Languages**: English (en), Chinese (zh)
- **Translation Files**: `locales/{lang}/translation.json`
- **Usage**: Access via `useTranslation()` hook

```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
const title = t("welcome.open_pdf");
```

### Dual Deployment Model

The application supports both **web** and **desktop** deployment from the same codebase:

**Web Mode** (browser):

- Static export via `next build` (outputs to `out/`)
- Progressive Web App (PWA) with service worker
- Limited file system access (uses File API)
- Tauri commands gracefully no-op

**Desktop Mode** (Tauri):

- Full native file system access
- Native dialogs and notifications
- Auto-update support
- Custom window controls
- File operations (rename, delete, reveal)

**Detection**: Use `isTauri()` from [lib/tauri-bridge.ts](lib/tauri-bridge.ts) to check runtime environment.

## Development Notes

### Build Configuration

- **Package Manager**: pnpm (required)
- **Next.js Output**: Static export (`output: "export"`) to `out/` directory
- **Tauri Frontend Dist**: Points to `../out` in tauri.conf.json
- **Dev Server**: Runs on `http://localhost:3000`
- **PWA**: Enabled in production builds via @ducanh2912/next-pwa

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** for automatic code quality checks:

- **ESLint**: Auto-fixes linting issues on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
- **Prettier**: Formats staged files (JS/TS, JSON, Markdown, YAML, CSS)

Hooks are automatically installed via `pnpm install` (the `prepare` script runs `husky`).

To skip hooks: `git commit --no-verify`

### Important Patterns

1. **PDF.js Worker**: Configured in pdf-utils.ts with proper worker path for both web and Tauri
2. **File Handling**: Use FileReader API for web, Tauri FS plugin for desktop
3. **State Persistence**: Only UI preferences and recent files persist; document state is session-only
4. **Touch Gestures**: Custom hook for pinch-zoom, swipe navigation on mobile
5. **Keyboard Shortcuts**: Comprehensive keyboard controls (see KeyboardShortcutsDialog component)

### Path Aliases

Configured in tsconfig.json and components.json:

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/utils` → `lib/utils.ts`
- `@/ui` → `components/ui/`
- `@/hooks` → `hooks/`

### Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

### Common Tasks

**Adding a new annotation tool**:

1. Add type to Annotation interface in pdf-store.ts
2. Update annotation rendering in pdf-annotation-layer.tsx
3. Add tool button to pdf-toolbar.tsx
4. Implement drawing logic in pdf-drawing-layer.tsx

**Adding a new language**:

1. Create `locales/{lang}/translation.json`
2. Copy structure from `locales/en/translation.json`
3. Language will auto-detect if browser locale matches

**Adding a Tauri command**:

1. Add Rust function with `#[tauri::command]` in src-tauri/src/lib.rs
2. Register in `invoke_handler![]` macro
3. Add TypeScript wrapper in lib/tauri-bridge.ts
