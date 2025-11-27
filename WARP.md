# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**SAST Readium** is a modern PDF reader and annotation application with AI integration.

- **Framework**: Next.js 16 (App Router) with React 19, TypeScript, and Tailwind CSS v4
- **Desktop**: Tauri 2.9 for cross-platform desktop (Windows, macOS, Linux)
- **Key entrypoints**: `app/layout.tsx`, `app/page.tsx`, global styles in `app/globals.css`
- **Config files**: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.prettierrc.json`
- **UI utilities**: `lib/utils.ts` exports `cn()` (clsx + tailwind-merge)
- **State management**: Zustand stores in `lib/pdf-store.ts` and `lib/ai-chat-store.ts`
- **i18n**: react-i18next with translations in `locales/en/` and `locales/zh/`

## Package Manager

Use **pnpm** (lockfile present). Examples below use pnpm.

## Common Commands

### Development

| Command        | Description                                        |
| -------------- | -------------------------------------------------- |
| `pnpm install` | Install dependencies                               |
| `pnpm dev`     | Start Next.js dev server (<http://localhost:3000>) |
| `pnpm build`   | Build for production (outputs to `out/`)           |
| `pnpm start`   | Start production server                            |

### Code Quality

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm lint`         | Run ESLint                   |
| `pnpm lint:fix`     | Run ESLint with auto-fix     |
| `pnpm typecheck`    | Run TypeScript type checking |
| `pnpm format`       | Format code with Prettier    |
| `pnpm format:check` | Check formatting             |

### Testing

| Command              | Description              |
| -------------------- | ------------------------ |
| `pnpm test`          | Run Jest tests           |
| `pnpm test:watch`    | Run tests in watch mode  |
| `pnpm test:coverage` | Generate coverage report |

### Desktop (Tauri)

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm tauri dev`   | Run desktop app with hot-reload |
| `pnpm tauri build` | Build distributable desktop app |
| `pnpm tauri info`  | Display Tauri environment info  |

## Pre-commit Hooks

The project uses **Husky** and **lint-staged** for automatic code quality checks:

- **ESLint**: Auto-fixes linting issues on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
- **Prettier**: Formats staged files (JS/TS, JSON, Markdown, YAML, CSS)

Hooks are automatically installed via `pnpm install` (the `prepare` script runs `husky`).

To skip hooks: `git commit --no-verify`

## Architecture and Conventions

### Routing

- App Router under `app/`
- `app/layout.tsx` defines fonts and wraps the app with providers
- `app/page.tsx` is the main PDF viewer + welcome page

### Styling

- Tailwind CSS v4 via PostCSS plugin (`@tailwindcss/postcss`)
- `app/globals.css` imports Tailwind, defines CSS variables for theming
- shadcn/ui components in `components/ui/`

### TypeScript

- Strict mode enabled
- Path alias: `@/*` → repo root (e.g., `@/lib/utils`, `@/components/ui/button`)

### Linting & Formatting

- ESLint: Flat config using `eslint-config-next` (core web vitals + TypeScript)
- Prettier: Configured via `.prettierrc.json`

### Test Configuration

- Jest 30.x with React Testing Library
- Test environment: jsdom
- Coverage thresholds: 70% lines/statements, 60% branches/functions
- Test files: `*.test.ts`, `*.test.tsx`

## AI/Assistant Rules

- `CLAUDE.md` - Claude Code guidance
- `GEMINI.md` - Gemini guidance
- `AGENTS.md` - Repository guidelines for all AI assistants
- `llmdoc/` - AI feature documentation
