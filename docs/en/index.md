# SAST Readium

<div align="center">
  <img src="../assets/logo.png" alt="SAST Readium Logo" width="128" height="128" />
  <p><strong>A modern, feature-rich PDF reader and annotation application</strong></p>
</div>

---

SAST Readium combines powerful PDF viewing capabilities with comprehensive annotation tools, supporting both **web** and **desktop** deployment from a single codebase.

## Key Features

<div class="grid cards" markdown>

- :material-file-document:{ .lg .middle } **PDF Viewing**

  ***

  Multiple view modes, flexible zoom (50%-500%), page rotation, and full-text search with highlighting.

  [:octicons-arrow-right-24: Learn more](features/pdf-viewer.md)

- :material-pencil:{ .lg .middle } **Annotations**

  ***

  Highlighting, comments, freehand drawing, shapes, stamps, and digital signatures with undo/redo support.

  [:octicons-arrow-right-24: Learn more](features/annotations.md)

- :material-robot:{ .lg .middle } **AI Assistant**

  ***

  Integrated AI chat with PDF context awareness, tool calling, and MCP protocol support.

  [:octicons-arrow-right-24: Learn more](features/ai-assistant.md)

- :material-palette:{ .lg .middle } **Custom Themes**

  ***

  Light, dark, sepia modes with auto-detection. Create and share custom color themes.

  [:octicons-arrow-right-24: Learn more](features/custom-themes.md)

</div>

## Technical Stack

| Category       | Technology                        |
| -------------- | --------------------------------- |
| **Frontend**   | Next.js 16, React 19, TypeScript  |
| **Desktop**    | Tauri 2.9 (Windows, macOS, Linux) |
| **PDF Engine** | PDF.js                            |
| **Styling**    | Tailwind CSS v4, shadcn/ui        |
| **State**      | Zustand with persistence          |
| **i18n**       | react-i18next                     |
| **Testing**    | Jest, React Testing Library       |
| **AI**         | Vercel AI SDK, MCP Protocol       |

## Quick Start

=== "Web Development"

    ```bash
    # Clone and install
    git clone https://github.com/NJUPT-SAST-CXX/sast-readium-web.git
    cd sast-readium-web
    pnpm install

    # Start development server
    pnpm dev
    ```

=== "Desktop Development"

    ```bash
    # Ensure Rust is installed
    rustc --version

    # Start Tauri development mode
    pnpm tauri dev
    ```

[:octicons-arrow-right-24: Full installation guide](getting-started/installation.md)

## Dual Deployment

SAST Readium supports two deployment modes from a single codebase:

- **Web Mode**: Progressive Web App with service worker support
- **Desktop Mode**: Native desktop application with full file system access

Both modes provide a seamless, consistent user experience.

## Community

- **Organization**: [SAST-CXX](https://github.com/NJUPT-SAST-CXX)
- **Website**: [SAST](https://sast.fun/)
- **Issues**: [GitHub Issues](https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues)

## License

This project is open source and available under the [MIT License](https://github.com/NJUPT-SAST-CXX/sast-readium-web/blob/main/LICENSE).
