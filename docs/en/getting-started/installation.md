# Installation

This guide walks you through setting up SAST Readium for development.

## Clone the Repository

```bash
git clone https://github.com/NJUPT-SAST-CXX/sast-readium-web.git
cd sast-readium-web
```

## Install Dependencies

```bash
pnpm install
```

This command:

1. Installs all Node.js dependencies
2. Sets up Husky pre-commit hooks automatically
3. Prepares the development environment

!!! note "First-time installation"
The first installation may take a few minutes as it downloads all dependencies and sets up the Rust toolchain for Tauri.

## Verify Installation

### Web Development

Start the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the SAST Readium welcome page.

### Desktop Development

Check the Tauri environment:

```bash
pnpm tauri info
```

This displays information about your Tauri setup, including:

- Operating system
- Rust version
- Node.js version
- Tauri CLI version

If everything is configured correctly, start the desktop application:

```bash
pnpm tauri dev
```

## Project Structure Overview

After installation, your project structure looks like this:

```text
sast-readium-web/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── pdf-viewer/         # PDF viewer components
│   ├── ai-sidebar/         # AI chat interface
│   ├── ui/                 # shadcn/ui components
│   └── ...
├── lib/                    # Utilities and services
├── hooks/                  # Custom React hooks
├── locales/                # i18n translation files
├── src-tauri/              # Tauri Rust backend
├── public/                 # Static assets
└── docs/                   # Documentation (this site)
```

## Environment Configuration

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```bash
# Example environment variables
NEXT_PUBLIC_APP_NAME=SAST Readium
```

!!! warning "Security" - Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser - Never commit `.env.local` to version control - Store sensitive API keys securely

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative paths
import { Button } from "../../../components/ui/button";

// Use path aliases
import { Button } from "@/components/ui/button";
```

Available aliases:

| Alias          | Path             |
| -------------- | ---------------- |
| `@/components` | `components/`    |
| `@/lib`        | `lib/`           |
| `@/ui`         | `components/ui/` |
| `@/hooks`      | `hooks/`         |

## Adding UI Components

SAST Readium uses [shadcn/ui](https://ui.shadcn.com/) for UI components. To add new components:

```bash
# Add a single component
pnpm dlx shadcn@latest add button

# Add multiple components
pnpm dlx shadcn@latest add card dialog tooltip
```

Components are added to `components/ui/` and can be customized as needed.

## Troubleshooting

### Port 3000 Already in Use

=== "Windows"

    ```powershell
    netstat -ano | findstr :3000
    taskkill /PID <PID> /F
    ```

=== "macOS / Linux"

    ```bash
    lsof -ti:3000 | xargs kill -9
    ```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Tauri Build Issues

```bash
# Update Rust
rustup update

# Clean Tauri build cache
cd src-tauri
cargo clean
cd ..

# Retry
pnpm tauri dev
```

## Next Steps

- [Quick Start](quick-start.md) - Learn the basics of using SAST Readium
- [Project Structure](../architecture/project-structure.md) - Understand the codebase organization
- [Development Scripts](../development/scripts.md) - Available npm scripts
