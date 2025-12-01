# Project Structure

This document provides a detailed overview of the SAST Readium codebase organization.

## Root Directory

```text
sast-readium-web/
├── app/                    # Next.js App Router
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and services
├── locales/                # i18n translation files
├── public/                 # Static assets
├── src-tauri/              # Tauri Rust backend
├── docs/                   # Documentation (MkDocs)
├── __mocks__/              # Jest mocks
├── coverage/               # Test coverage reports
└── out/                    # Production build output
```

## App Directory

Next.js App Router structure:

```text
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Main application page
├── globals.css             # Global styles and CSS variables
└── about/
    └── page.tsx            # About page with runtime info
```

### Key Files

- **`layout.tsx`**: Wraps the app with theme provider, i18n provider, and global styles
- **`page.tsx`**: Main entry point containing PDF viewer and welcome page logic
- **`globals.css`**: Tailwind CSS imports and CSS custom properties for theming

## Components Directory

React components organized by feature:

```text
components/
├── pdf-viewer/             # PDF viewing components
│   ├── pdf-viewer.tsx      # Main viewer container
│   ├── pdf-toolbar.tsx     # Desktop toolbar
│   ├── pdf-mobile-toolbar.tsx
│   ├── pdf-menubar.tsx     # Desktop menu bar
│   ├── pdf-page.tsx        # Single page renderer
│   ├── pdf-text-layer.tsx  # Text selection layer
│   ├── pdf-annotation-layer.tsx
│   ├── pdf-drawing-layer.tsx
│   ├── pdf-selection-layer.tsx
│   ├── pdf-outline.tsx     # Table of contents
│   ├── pdf-bookmarks.tsx   # User bookmarks
│   ├── pdf-thumbnail.tsx   # Page thumbnails
│   ├── pdf-tts-reader.tsx  # Text-to-speech
│   ├── pdf-settings-dialog.tsx
│   ├── pdf-properties-dialog.tsx
│   └── __tests__/          # Component tests
├── ai-sidebar/             # AI chat interface
│   ├── ai-sidebar.tsx      # Sidebar container
│   ├── ai-chat-panel.tsx   # Chat conversation
│   ├── ai-settings-panel.tsx
│   ├── ai-tools-panel.tsx
│   ├── ai-history-panel.tsx
│   └── __tests__/
├── ai-elements/            # AI message components
│   ├── message.tsx         # Message bubble
│   ├── prompt-input.tsx    # User input
│   ├── code-block.tsx      # Code rendering
│   ├── tool.tsx            # Tool call display
│   ├── reasoning.tsx       # Chain of thought
│   └── __tests__/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   └── ...
├── welcome-page/           # Welcome screen
│   ├── welcome-page.tsx
│   └── file-drop-zone.tsx
├── providers/              # React context providers
│   └── theme-provider.tsx
├── theme-manager.tsx       # Theme switching logic
├── language-switcher.tsx   # i18n language toggle
└── splash-screen.tsx       # Loading animation
```

## Lib Directory

Utilities, services, and state management:

```text
lib/
├── pdf-store.ts            # PDF state (Zustand)
├── ai-chat-store.ts        # AI chat state (Zustand)
├── custom-theme-store.ts   # Custom themes (Zustand)
├── pdf-utils.ts            # PDF.js utilities
├── ai-service.ts           # AI text generation
├── ai-providers.ts         # AI provider configs
├── mcp-client.ts           # MCP protocol client
├── tauri-bridge.ts         # Tauri command wrappers
├── tauri-bridge-ai.ts      # AI-specific Tauri commands
├── archive-utils.ts        # ZIP/RAR extraction
├── notification-service.ts # Toast notifications
├── update-service.ts       # App update checking
├── i18n.ts                 # i18next configuration
├── utils.ts                # General utilities (cn)
└── *.test.ts               # Unit tests
```

### State Stores

| Store                   | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `pdf-store.ts`          | PDF document state, annotations, bookmarks, view settings |
| `ai-chat-store.ts`      | AI conversations, provider settings, MCP configs          |
| `custom-theme-store.ts` | Custom theme definitions, presets                         |

### Services

| Service           | Purpose                                 |
| ----------------- | --------------------------------------- |
| `ai-service.ts`   | Streaming text generation, tool calling |
| `pdf-utils.ts`    | PDF loading, text extraction, metadata  |
| `tauri-bridge.ts` | File operations, system info            |
| `mcp-client.ts`   | MCP server connections                  |

## Hooks Directory

Custom React hooks:

```text
hooks/
├── use-ai-chat.ts          # AI chat logic
├── use-ai-media.ts         # Image/speech generation
├── use-pdf-context.ts      # PDF context for AI
├── use-deep-research.ts    # Multi-step research
├── use-touch-gestures.ts   # Touch interactions
├── use-tts.ts              # Text-to-speech
├── use-device-orientation.ts
├── use-chart-insight.ts    # Chart analysis
├── use-report-template.ts  # Report generation
└── *.test.ts               # Hook tests
```

## Locales Directory

Internationalization files:

```text
locales/
├── en/
│   └── translation.json    # English translations
└── zh/
    └── translation.json    # Chinese translations
```

### Translation Structure

```json
{
  "common": {
    "open": "Open",
    "save": "Save",
    "cancel": "Cancel"
  },
  "pdf": {
    "page": "Page",
    "zoom": "Zoom"
  },
  "ai": {
    "send": "Send",
    "thinking": "Thinking..."
  }
}
```

## Tauri Directory

Rust backend for desktop:

```text
src-tauri/
├── src/
│   ├── lib.rs              # Tauri commands
│   └── main.rs             # Application entry
├── capabilities/
│   └── default.json        # Permission definitions
├── icons/                  # App icons
├── tauri.conf.json         # Tauri configuration
├── Cargo.toml              # Rust dependencies
└── Cargo.lock
```

### Tauri Commands

Defined in `src/lib.rs`:

- `get_system_info()` - OS and architecture info
- `get_app_runtime_info()` - App version, paths
- `reveal_in_file_manager()` - Open file location
- `rename_file()` - Rename files
- `delete_file()` - Delete files

## Public Directory

Static assets:

```text
public/
├── icons/                  # PWA icons
├── app-icon.png            # Application icon
├── manifest.json           # PWA manifest
└── *.svg                   # SVG assets
```

## Configuration Files

| File                 | Purpose                     |
| -------------------- | --------------------------- |
| `next.config.ts`     | Next.js configuration       |
| `tsconfig.json`      | TypeScript configuration    |
| `tailwind.config.ts` | Tailwind CSS configuration  |
| `postcss.config.mjs` | PostCSS plugins             |
| `eslint.config.mjs`  | ESLint rules                |
| `.prettierrc.json`   | Prettier formatting         |
| `jest.config.ts`     | Jest test configuration     |
| `components.json`    | shadcn/ui configuration     |
| `mkdocs.yml`         | Documentation configuration |

## Test Files

Tests are co-located with source files:

```text
lib/
├── pdf-store.ts
├── pdf-store.test.ts       # Unit test
components/pdf-viewer/
├── pdf-viewer.tsx
├── __tests__/
│   └── pdf-viewer.test.tsx # Component test
```

## Build Output

### Web Build (`out/`)

Static export for web deployment:

```text
out/
├── index.html
├── _next/
│   ├── static/
│   └── chunks/
└── ...
```

### Desktop Build (`src-tauri/target/`)

Platform-specific installers:

```text
src-tauri/target/release/bundle/
├── msi/                    # Windows MSI
├── nsis/                   # Windows NSIS
├── dmg/                    # macOS DMG
├── macos/                  # macOS app bundle
├── appimage/               # Linux AppImage
└── deb/                    # Debian package
```
