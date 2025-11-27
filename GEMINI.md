# GEMINI.md

## Project Overview

**SAST Readium** is a modern, feature-rich PDF reader and annotation application built for performance and usability. It combines web and desktop capabilities in a single codebase.

### Core Technologies

- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS v4
- **Desktop Framework**: Tauri 2.9 for cross-platform desktop (Windows, macOS, Linux)
- **PDF Rendering**: PDF.js (pdfjs-dist) with react-pdf
- **UI Components**: shadcn/ui with Radix UI primitives and Lucide icons
- **State Management**: Zustand with persistence middleware
- **Internationalization**: react-i18next with language detection
- **AI Integration**: Vercel AI SDK with tool calling support

### Project Structure

```text
sast-readium-web/
├── app/                    # Next.js App Router
├── components/
│   ├── pdf-viewer/         # PDF viewer components
│   ├── ai-sidebar/         # AI chat interface
│   ├── ai-elements/        # AI message rendering
│   ├── ui/                 # shadcn/ui components
│   └── welcome-page/       # Welcome screen
├── lib/                    # Utilities and services
├── hooks/                  # Custom React hooks
├── locales/                # i18n translations (en, zh)
├── src-tauri/              # Rust backend
└── llmdoc/                 # AI feature documentation
```

## Building and Running

### Frontend (Web)

| Command              | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `pnpm dev`           | Start Next.js development server (<http://localhost:3000>) |
| `pnpm build`         | Create production build (outputs to `out/`)                |
| `pnpm start`         | Start production server                                    |
| `pnpm lint`          | Run ESLint                                                 |
| `pnpm lint:fix`      | Run ESLint with auto-fix                                   |
| `pnpm typecheck`     | Run TypeScript type checking                               |
| `pnpm format`        | Format code with Prettier                                  |
| `pnpm format:check`  | Check formatting                                           |
| `pnpm test`          | Run Jest tests                                             |
| `pnpm test:watch`    | Run tests in watch mode                                    |
| `pnpm test:coverage` | Generate coverage report                                   |

### Desktop (Tauri)

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm tauri dev`   | Run desktop app with hot-reload         |
| `pnpm tauri build` | Build distributable desktop application |
| `pnpm tauri info`  | Display Tauri environment info          |

## Development Conventions

### Styling

- **Tailwind CSS v4**: Utility-first styling with CSS variables for theming
- **UI Components**: shadcn/ui components in `components/ui/`, customizable and extendable
- **Utilities**: `cn()` function from `lib/utils.ts` (clsx + tailwind-merge)

### Linting & Formatting

- **ESLint**: Configured via `eslint.config.mjs` (Next.js core-web-vitals + TypeScript)
- **Prettier**: Configured via `.prettierrc.json` for consistent code style
- **Pre-commit Hooks**: Husky + lint-staged for automatic checks

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** for automatic code quality checks:

- **ESLint**: Auto-fixes linting issues on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
- **Prettier**: Formats staged files (JS/TS, JSON, Markdown, YAML, CSS)

Hooks are automatically installed via `pnpm install`.

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Path alias: `@/*` → project root (e.g., `@/lib/utils`, `@/components/ui/button`)

### Testing

- **Test Runner**: Jest 30.x with React Testing Library
- **Test Environment**: jsdom
- **Coverage Thresholds**: 70% lines/statements, 60% branches/functions
- **Test Files**: `*.test.ts`, `*.test.tsx` (co-located or in `__tests__/`)
