# Quick Start

This guide helps you get started with SAST Readium development quickly.

## Starting Development

### Web Development

```bash
pnpm dev
```

This starts the Next.js development server at [http://localhost:3000](http://localhost:3000) with:

- Hot Module Replacement (HMR) for instant updates
- Error overlay for debugging
- TypeScript type checking

### Desktop Development

```bash
pnpm tauri dev
```

This command:

1. Starts the Next.js development server
2. Compiles the Rust backend
3. Launches the Tauri desktop application
4. Enables hot-reload for both frontend and Rust code

## Opening a PDF

1. Launch the application (web or desktop)
2. You'll see the welcome page with options to:
   - **Drag and drop** a PDF file
   - Click **Open File** to browse
   - Select from **Recent Files**

!!! tip "Archive Support"
SAST Readium can also open PDFs from ZIP, CBZ, RAR, and CBR archives.

## Basic Navigation

### Keyboard Shortcuts

| Shortcut                         | Action             |
| -------------------------------- | ------------------ |
| ++arrow-left++ / ++arrow-right++ | Previous/Next page |
| ++home++ / ++end++               | First/Last page    |
| ++plus++ / ++minus++             | Zoom in/out        |
| ++0++                            | Reset zoom         |
| ++f++                            | Toggle fullscreen  |
| ++ctrl+f++                       | Search             |
| ++ctrl+b++                       | Toggle bookmarks   |
| ++question++                     | Show all shortcuts |

### View Modes

Switch between view modes using the toolbar:

- **Single Page**: One page at a time
- **Continuous**: Scroll through all pages
- **Two Page**: Side-by-side facing pages

### Zoom Options

- **Custom**: Manual zoom (50%-500%)
- **Fit Width**: Fit page width to viewport
- **Fit Page**: Fit entire page in viewport

## Using Annotations

### Highlighting Text

1. Select text in the PDF
2. Click the highlight color in the context menu
3. The highlight is saved automatically

### Adding Comments

1. Click the comment tool in the annotation toolbar
2. Click on the page where you want to add a comment
3. Type your comment and click outside to save

### Drawing

1. Select the drawing tool
2. Choose stroke color and width
3. Draw freehand on the page
4. Click the drawing tool again to exit drawing mode

### Undo/Redo

- ++ctrl+z++ - Undo last annotation action
- ++ctrl+y++ - Redo undone action

## AI Assistant

SAST Readium includes an integrated AI assistant for PDF analysis.

### Opening AI Sidebar

Click the AI icon in the toolbar or press ++ctrl+shift+a++ to open the AI sidebar.

### Features

- **PDF Context Awareness**: AI understands the current PDF content
- **Tool Calling**: AI can perform actions like searching, navigating
- **Multi-Provider Support**: OpenAI, Anthropic, and custom providers
- **MCP Protocol**: Connect to external tools via Model Context Protocol

### Configuration

1. Open AI Settings in the sidebar
2. Select your preferred AI provider
3. Enter your API key
4. Customize model and parameters

## Customization

### Themes

Switch themes using the theme toggle in the toolbar:

- **Light**: Default light theme
- **Dark**: Dark mode for low-light environments
- **Sepia**: Warm tones for comfortable reading
- **Auto**: Follow system preference

### Custom Themes

Create custom color themes:

1. Open Settings → Custom Themes
2. Click "Create New Theme"
3. Customize colors using the color picker
4. Save and apply your theme

### Language

Switch between English and Chinese:

1. Click the language switcher in the toolbar
2. Select your preferred language
3. The interface updates immediately

## Building for Production

### Web Build

```bash
pnpm build
```

Output is generated in the `out/` directory, ready for static hosting.

### Desktop Build

```bash
pnpm tauri build
```

Platform-specific installers are generated in:

- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/appimage/`

## Next Steps

- [PDF Viewer Features](../features/pdf-viewer.md) - Explore all viewer capabilities
- [Annotations Guide](../features/annotations.md) - Master annotation tools
- [AI Assistant](../features/ai-assistant.md) - Learn about AI features
- [Development Guide](../development/scripts.md) - Available scripts and commands
