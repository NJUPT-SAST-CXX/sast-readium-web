# Repository Guidelines

## Project Structure & Module Organization

- `app/` Next.js App Router (routes: `page.tsx`, `layout.tsx`, global styles in `globals.css`).
- `components/` React components organized by feature:
  - `components/ui/` Reusable UI components (shadcn patterns).
  - `components/pdf-viewer/` PDF viewer components.
  - `components/ai-sidebar/` AI chat interface components.
  - `components/ai-elements/` AI message rendering components.
  - `components/welcome-page/` Welcome screen components.
- `lib/` Shared utilities and services:
  - `lib/pdf-store.ts` — Zustand store for PDF state.
  - `lib/ai-chat-store.ts` — Zustand store for AI chat state.
  - `lib/ai-service.ts` — AI service with streaming and tool calling.
  - `lib/tauri-bridge.ts` — Tauri command wrappers.
  - `lib/i18n.ts` — i18next configuration.
- `hooks/` Custom React hooks (`use-ai-chat.ts`, `use-touch-gestures.ts`, etc.).
- `locales/` i18n translation files (`en/`, `zh/`).
- `public/` Static assets (SVGs, icons, PWA manifest).
- `src-tauri/` Tauri desktop wrapper (Rust code, config, icons).
- `llmdoc/` LLM-focused documentation for AI features.
- Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `.prettierrc.json`.

## Build, Test, and Development Commands

### Frontend Development

- `pnpm dev` — Run Next.js in development (<http://localhost:3000>).
- `pnpm build` — Create a production build (outputs to `out/`).
- `pnpm start` — Serve the production build.

### Code Quality

- `pnpm lint` — Run ESLint on all files.
- `pnpm lint:fix` — Run ESLint with auto-fix.
- `pnpm typecheck` — Run TypeScript type checking.
- `pnpm format` — Format all files with Prettier.
- `pnpm format:check` — Check formatting without modifying files.

### Testing

- `pnpm test` — Run Jest tests.
- `pnpm test:watch` — Run tests in watch mode.
- `pnpm test:coverage` — Generate test coverage report.

### Desktop Development

- `pnpm tauri dev` — Launch desktop app with hot-reload.
- `pnpm tauri build` — Build desktop binaries.
- `pnpm tauri info` — Display Tauri environment info.

## Pre-commit Hooks

This project uses **Husky** and **lint-staged** for pre-commit checks:

- **ESLint**: Auto-fixes linting issues on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files.
- **Prettier**: Formats staged files (JS/TS, JSON, Markdown, YAML, CSS).

Pre-commit hooks are automatically installed when you run `pnpm install` (via the `prepare` script).

To skip pre-commit hooks (not recommended): `git commit --no-verify`

## Coding Style & Naming Conventions

- Language: TypeScript with React 19 and Next.js 16.
- Linting: `eslint.config.mjs` is the source of truth; keep code warning-free.
- Formatting: Prettier (`.prettierrc.json`) for consistent code style.
- Styling: Tailwind CSS v4 (utility-first). Co-locate minimal component-specific styles.
- Components: PascalCase names/exports; files in `components/ui/` mirror export names.
- Routes: Next app files are lowercase (`page.tsx`, `layout.tsx`).
- Code: camelCase variables/functions; hooks start with `use*`.

## Testing Guidelines

- Test runner: Jest 30.x with React Testing Library.
- Test environment: jsdom (simulates browser).
- Name tests `*.test.ts`/`*.test.tsx`; co-locate next to source or in `__tests__/`.
- Coverage thresholds: 70% lines/statements, 60% branches/functions.
- Prioritize `lib/` utilities and complex UI logic for coverage.

## Commit & Pull Request Guidelines

- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `ci:`, `test:`.
- Link issues in the footer: `Closes #123`.
- PRs should include: brief scope/intent, screenshots for UI changes, validation steps.
- All PRs must pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Keep changes focused; avoid unrelated refactors.

## Security & Configuration Tips

- Use `.env.local` for secrets; do not commit `.env*` files.
- Only expose safe client values via `NEXT_PUBLIC_*`.
- Tauri: minimize capabilities in `src-tauri/tauri.conf.json`; avoid broad filesystem access.
- AI API keys: stored securely using Web Crypto API (browser) or OS credential management (Tauri).
