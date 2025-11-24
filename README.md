# SAST Readium

A modern, feature-rich PDF reader and annotation application built for performance and usability. SAST Readium combines powerful PDF viewing capabilities with comprehensive annotation tools, supporting both web and desktop deployment from a single codebase.

[中文文档](./README_zh.md)

## Features

### PDF Viewing & Navigation

- 📄 **Multiple View Modes**: Single page, continuous scroll, facing pages
- 🔍 **Flexible Zoom**: 50%-500% zoom range with page fit, width fit, and auto fit modes
- 🔄 **Page Rotation**: Support for 0°, 90°, 180°, 270° rotation
- 🎨 **Theme Support**: Light, dark, sepia modes with auto-detection
- 📑 **Document Outline**: Navigate via table of contents
- 🖼️ **Thumbnail Sidebar**: Visual page navigation with drag-and-drop reordering
- 🎯 **Full-Text Search**: Find text across the entire document with highlighting
- ⌨️ **Keyboard Shortcuts**: Comprehensive keyboard controls for efficient navigation

### Annotation Tools

- ✏️ **Highlighting**: Multi-color text highlighting with custom colors
- 💬 **Comments**: Add text annotations to any page
- 🎨 **Drawing Tools**: Freehand drawing with adjustable stroke width
- 📐 **Shapes**: Insert rectangles, circles, and arrows
- 🖼️ **Stamps & Signatures**: Add custom stamps and digital signatures
- ↩️ **Undo/Redo**: Full annotation history with undo/redo support

### Advanced Features

- 🔖 **Bookmarks**: Create and manage custom bookmarks with titles
- 🔊 **Text-to-Speech**: Read PDFs aloud with adjustable speed and volume
- 📝 **Metadata Editing**: View and edit PDF metadata
- 🏷️ **Watermarking**: Add watermarks to PDF documents
- 📁 **File Operations**: Rename, delete, and reveal files in system file manager
- 📑 **Multi-Tab Support**: Open and manage multiple PDFs simultaneously
- 📦 **Archive Support**: Extract and read PDFs from ZIP/RAR archives
- 🌍 **Internationalization**: English and Chinese language support
- 📱 **Touch Gestures**: Pinch-to-zoom and swipe navigation on touch devices

### Technical Stack

- ⚡️ **Next.js 16** with App Router and React 19
- 🖥️ **Tauri 2.9** for native desktop applications (Windows, macOS, Linux)
- 📄 **PDF.js** for high-quality PDF rendering
- 🎨 **Tailwind CSS v4** with CSS variables and theme support
- 🧩 **shadcn/ui** component library with Radix UI primitives
- 📦 **Zustand** for state management with persistence
- 🌐 **react-i18next** for internationalization
- 🧪 **Jest** with React Testing Library for testing
- 🎯 **TypeScript** for type safety
- 📱 **PWA Support** for web deployment

## Prerequisites

Before you begin, ensure you have the following installed:

### For Web Development

- **Node.js** 20.x or later ([Download](https://nodejs.org/))
- **pnpm** 8.x or later (recommended)

  ```bash
  npm install -g pnpm
  ```

### For Desktop Development (Additional Requirements)

- **Rust** 1.70 or later ([Install](https://www.rust-lang.org/tools/install))

  ```bash
  # Verify installation
  rustc --version
  cargo --version
  ```

- **System Dependencies** (varies by OS):
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: See [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NJUPT-SAST-CXX/sast-readium-web.git
   cd sast-readium-web
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Verify installation**

   ```bash
   # Start web development server
   pnpm dev

   # Check Tauri environment (for desktop development)
   pnpm tauri info
   ```

## Development

### Web Application Development

#### Start Development Server

```bash
pnpm dev
```

This starts the Next.js development server at [http://localhost:3000](http://localhost:3000). The page auto-reloads when you edit files.

#### Key Development Files

- `app/page.tsx` - Main application entry point
- `components/pdf-viewer/` - PDF viewer components
- `lib/pdf-store.ts` - Zustand state management
- `lib/pdf-utils.ts` - PDF.js integration utilities
- `locales/` - Internationalization files

### Desktop Application Development

#### Start Tauri Development Mode

```bash
pnpm tauri dev
```

This command:

1. Starts the Next.js development server
2. Launches the Tauri desktop application
3. Enables hot-reload for both frontend and Rust code

#### Tauri Development Files

- `src-tauri/src/lib.rs` - Custom Tauri commands (file operations, system info)
- `src-tauri/src/main.rs` - Main Rust application entry point
- `src-tauri/tauri.conf.json` - Tauri configuration

## Available Scripts

### Frontend Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server on port 3000 |
| `pnpm build` | Build Next.js app for production (outputs to `out/` directory) |
| `pnpm start` | Start Next.js production server (after `pnpm build`) |
| `pnpm lint` | Run ESLint to check code quality |
| `pnpm test` | Run Jest tests |
| `pnpm test:watch` | Run Jest tests in watch mode |
| `pnpm test:coverage` | Generate test coverage report |

### Tauri (Desktop) Scripts

| Command | Description |
|---------|-------------|
| `pnpm tauri dev` | Start Tauri development mode with hot-reload |
| `pnpm tauri build` | Build production desktop application |
| `pnpm tauri info` | Display Tauri environment information |
| `pnpm tauri --help` | Show all available Tauri commands |

### Adding UI Components (shadcn/ui)

```bash
# Add a new component (e.g., Card)
pnpm dlx shadcn@latest add card

# Add multiple components
pnpm dlx shadcn@latest add button card dialog
```

## Project Structure

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
│   │   ├── pdf-annotation-layer.tsx # Annotation rendering
│   │   ├── pdf-drawing-layer.tsx    # Drawing tools
│   │   ├── pdf-outline.tsx      # PDF table of contents
│   │   ├── pdf-bookmarks.tsx    # User bookmarks
│   │   ├── pdf-tts-reader.tsx   # Text-to-speech reader
│   │   └── ...                  # More PDF components
│   ├── ui/                      # shadcn/ui components
│   ├── welcome-page/            # Welcome screen
│   └── ...                      # Other components
├── lib/
│   ├── pdf-store.ts             # Zustand store for PDF state
│   ├── pdf-utils.ts             # PDF.js utilities
│   ├── tauri-bridge.ts          # Tauri command wrappers
│   ├── archive-utils.ts         # ZIP/RAR extraction
│   ├── i18n.ts                  # i18next configuration
│   └── ...                      # Other utilities
├── hooks/                       # Custom React hooks
├── locales/                     # i18n translation files
│   ├── en/translation.json      # English
│   └── zh/translation.json      # Chinese
├── src-tauri/                   # Rust backend
│   ├── src/lib.rs               # Custom Tauri commands
│   └── tauri.conf.json          # Tauri configuration
└── public/                      # Static assets
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory for environment-specific variables:

```env
# Example environment variables
NEXT_PUBLIC_APP_NAME=SAST Readium
```

**Important**:

- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never commit `.env.local` to version control

### Path Aliases

Configured in `tsconfig.json` and `components.json`:

```typescript
import { Button } from "@/components/ui/button"
import { usePDFStore } from "@/lib/pdf-store"
import { cn } from "@/lib/utils"
```

Available aliases:

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/ui` → `components/ui/`
- `@/hooks` → `hooks/`

## Building for Production

### Build Web Application

```bash
# Build static export
pnpm build

# Output directory: out/
# Deploy the out/ directory to any static hosting service
```

The build creates a static export in the `out/` directory, optimized for production.

### Build Desktop Application

```bash
# Build for current platform
pnpm tauri build

# Output locations:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/appimage/
```

Build options:

```bash
# Build for specific target
pnpm tauri build --target x86_64-pc-windows-msvc

# Build with debug symbols
pnpm tauri build --debug
```

## Deployment

### Web Deployment

The application can be deployed as a static site to:

- **Vercel** (Recommended) - Auto-detects Next.js configuration
- **Netlify** - Deploy the `out/` directory
- **GitHub Pages** - Host the static export
- **Any static hosting** - Upload the `out/` directory

### Desktop Deployment

#### Windows

- Distribute the `.msi` installer from `src-tauri/target/release/bundle/msi/`
- Users run the installer to install the application

#### macOS

- Distribute the `.dmg` file from `src-tauri/target/release/bundle/dmg/`
- Users drag the app to Applications folder
- **Note**: For distribution outside the App Store, code signing with Apple Developer certificate is required

#### Linux

- Distribute the `.AppImage` from `src-tauri/target/release/bundle/appimage/`
- Users make it executable and run: `chmod +x app.AppImage && ./app.AppImage`
- Alternative formats: `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL)

See [Tauri Distribution Guide](https://tauri.app/v1/guides/distribution/) for detailed instructions.

## Testing

The project uses Jest with React Testing Library for testing:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

- Test files: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Coverage thresholds: 70% lines/statements, 60% branches/functions
- Test environment: jsdom

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←` / `→` | Previous/Next page |
| `Home` / `End` | First/Last page |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom |
| `F` | Toggle fullscreen |
| `Ctrl+F` | Search |
| `Ctrl+B` | Toggle bookmarks |
| `Ctrl+Z` / `Ctrl+Y` | Undo/Redo annotations |

Press `?` in the app to view all keyboard shortcuts.

## Troubleshooting

### Common Issues

**Port 3000 already in use**

```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Tauri build fails**

```bash
# Check Tauri environment
pnpm tauri info

# Update Rust
rustup update

# Clean build cache
cd src-tauri
cargo clean
```

**PDF rendering issues**

- Ensure PDF.js worker is properly configured in `lib/pdf-utils.ts`
- Check browser console for errors
- Try a different PDF file to isolate the issue

## Learn More

### Documentation

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Tauri Documentation](https://tauri.app/) - Official Tauri documentation
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/) - PDF.js API reference
- [shadcn/ui](https://ui.shadcn.com/) - Component library documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind CSS documentation
- [Zustand](https://zustand-demo.pmnd.rs/) - Zustand state management

### Related Projects

- [PDF.js](https://github.com/mozilla/pdf.js) - PDF rendering engine
- [react-pdf](https://github.com/wojtekmaj/react-pdf) - React PDF viewer components
- [Tauri](https://github.com/tauri-apps/tauri) - Desktop application framework

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:

- Follows the existing code style (run `pnpm lint`)
- Includes tests for new features
- Updates documentation as needed

## License

This project is open source and available under the [MIT License](LICENSE).

## Team

Developed by the C++ group of SAST (Students' Association for Science and Technology) at NJUPT.

- **Organization**: [SAST-CXX](https://github.com/NJUPT-SAST-CXX)
- **Website**: [SAST](https://sast.fun/)

## Support

If you encounter any issues or have questions:

- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on [GitHub](https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues)
- Review the documentation links above

---

**Note**: This project supports dual deployment:

- **Web Mode**: Progressive Web App with service worker support
- **Desktop Mode**: Native desktop application with full file system access

Both modes share the same codebase and provide a seamless user experience.
