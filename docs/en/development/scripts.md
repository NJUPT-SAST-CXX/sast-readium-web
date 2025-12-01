# Scripts & Commands

This guide covers all available npm scripts and development commands for SAST Readium.

## Frontend Scripts

### Development

```bash
pnpm dev
```

Starts the Next.js development server at [http://localhost:3000](http://localhost:3000).

**Features:**

- Hot Module Replacement (HMR)
- Fast Refresh for React components
- Error overlay
- TypeScript type checking

### Production Build

```bash
pnpm build
```

Creates an optimized production build in the `out/` directory.

**Output:**

- Static HTML export
- Optimized JavaScript bundles
- Compressed assets
- Generated service worker (PWA)

### Start Production Server

```bash
pnpm start
```

Serves the production build locally for testing.

!!! note
Run `pnpm build` first before using `pnpm start`.

## Code Quality

### Linting

```bash
# Check for linting issues
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

Uses ESLint with the Next.js recommended configuration.

**Checked Rules:**

- React best practices
- TypeScript rules
- Import ordering
- Accessibility (a11y)

### Type Checking

```bash
pnpm typecheck
```

Runs TypeScript compiler without emitting files.

**Checks:**

- Type errors
- Missing types
- Incorrect type usage
- Unused variables (with strict mode)

### Formatting

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format:check
```

Uses Prettier for consistent code formatting.

**Formatted Files:**

- TypeScript/JavaScript
- JSON
- Markdown
- CSS/SCSS
- YAML

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

Uses Jest with React Testing Library.

### Test Options

```bash
# Run specific test file
pnpm test path/to/file.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="Button"

# Update snapshots
pnpm test --updateSnapshot

# Run in CI mode
pnpm test --ci
```

### Coverage Report

After running `pnpm test:coverage`:

- **HTML Report**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **Console**: Summary printed to terminal

## Tauri (Desktop) Scripts

### Development Mode

```bash
pnpm tauri dev
```

Starts both Next.js and Tauri in development mode.

**Process:**

1. Starts Next.js dev server
2. Compiles Rust backend
3. Launches desktop window
4. Enables hot-reload

### Production Build

```bash
pnpm tauri build
```

Creates platform-specific installers.

**Output Locations:**

| Platform | Format   | Path                                        |
| -------- | -------- | ------------------------------------------- |
| Windows  | MSI      | `src-tauri/target/release/bundle/msi/`      |
| Windows  | NSIS     | `src-tauri/target/release/bundle/nsis/`     |
| macOS    | DMG      | `src-tauri/target/release/bundle/dmg/`      |
| macOS    | App      | `src-tauri/target/release/bundle/macos/`    |
| Linux    | AppImage | `src-tauri/target/release/bundle/appimage/` |
| Linux    | Deb      | `src-tauri/target/release/bundle/deb/`      |

### Build Options

```bash
# Build for specific target
pnpm tauri build --target x86_64-pc-windows-msvc

# Build with debug symbols
pnpm tauri build --debug

# Build specific bundle type
pnpm tauri build --bundles msi
```

### Environment Info

```bash
pnpm tauri info
```

Displays information about your Tauri environment:

- Operating system
- Rust version
- Node.js version
- Tauri CLI version
- WebView version

### Other Tauri Commands

```bash
# Show all commands
pnpm tauri --help

# Generate icons
pnpm tauri icon path/to/icon.png

# Update Tauri dependencies
pnpm tauri update
```

## UI Components

### Adding shadcn/ui Components

```bash
# Add single component
pnpm dlx shadcn@latest add button

# Add multiple components
pnpm dlx shadcn@latest add card dialog tooltip

# Add all components
pnpm dlx shadcn@latest add --all
```

### Available Components

View all available components:

```bash
pnpm dlx shadcn@latest add --help
```

## Documentation

### Serve Documentation

```bash
# Install MkDocs (if not installed)
pip install mkdocs-material mkdocs-i18n

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

## Git Hooks

### Pre-commit Hooks

Automatically run on `git commit`:

1. **ESLint**: Fixes linting issues on staged files
2. **Prettier**: Formats staged files

### Skip Hooks

```bash
# Not recommended, but possible
git commit --no-verify
```

### Manual Hook Execution

```bash
# Run pre-commit manually
pnpm exec lint-staged
```

## Environment Variables

### Development

Create `.env.local` for local development:

```bash
# Example
NEXT_PUBLIC_APP_NAME=SAST Readium Dev
```

### Production

Set environment variables in your deployment platform or CI/CD.

## Useful Commands

### Clean Build

```bash
# Remove build artifacts
rm -rf out .next

# Clean Tauri build
cd src-tauri && cargo clean && cd ..

# Remove node_modules
rm -rf node_modules

# Fresh install
pnpm install
```

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name
```

### Analyze Bundle

```bash
# Build with bundle analyzer
ANALYZE=true pnpm build
```

## CI/CD Commands

Commands used in GitHub Actions:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run checks
pnpm lint
pnpm typecheck
pnpm test --ci --coverage

# Build
pnpm build
pnpm tauri build
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Clear Caches

```bash
# Next.js cache
rm -rf .next

# pnpm cache
pnpm store prune

# Rust cache
cd src-tauri && cargo clean
```
