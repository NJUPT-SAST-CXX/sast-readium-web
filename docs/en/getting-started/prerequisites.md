# Prerequisites

Before you begin developing with SAST Readium, ensure you have the following tools installed on your system.

## Web Development Requirements

### Node.js

**Version**: 20.x or later

Node.js is required for running the Next.js development server and build tools.

=== "Windows"

    Download and install from [nodejs.org](https://nodejs.org/)

=== "macOS"

    ```bash
    # Using Homebrew
    brew install node@20
    ```

=== "Linux"

    ```bash
    # Using nvm (recommended)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    nvm install 20
    nvm use 20
    ```

Verify installation:

```bash
node --version  # Should output v20.x.x or higher
npm --version   # Should output 10.x.x or higher
```

### pnpm

**Version**: 8.x or later (recommended)

pnpm is the recommended package manager for this project due to its speed and disk efficiency.

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm --version  # Should output 8.x.x or higher
```

## Desktop Development Requirements

For building native desktop applications with Tauri, you need additional system dependencies.

### Rust

**Version**: 1.70 or later

Rust is required for compiling the Tauri backend.

=== "Windows"

    Download and run [rustup-init.exe](https://win.rustup.rs/)

=== "macOS / Linux"

    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```

Verify installation:

```bash
rustc --version  # Should output 1.70.x or higher
cargo --version  # Should output 1.70.x or higher
```

### Platform-Specific Dependencies

=== "Windows"

    **Microsoft Visual Studio C++ Build Tools**

    1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
    2. Run the installer
    3. Select "Desktop development with C++" workload
    4. Ensure "Windows 10/11 SDK" is selected

=== "macOS"

    **Xcode Command Line Tools**

    ```bash
    xcode-select --install
    ```

=== "Linux (Ubuntu/Debian)"

    ```bash
    sudo apt update
    sudo apt install -y \
        libwebkit2gtk-4.1-dev \
        libgtk-3-dev \
        libappindicator3-dev \
        librsvg2-dev \
        patchelf \
        libssl-dev
    ```

=== "Linux (Fedora)"

    ```bash
    sudo dnf install -y \
        webkit2gtk4.1-devel \
        gtk3-devel \
        libappindicator-gtk3-devel \
        librsvg2-devel \
        openssl-devel
    ```

=== "Linux (Arch)"

    ```bash
    sudo pacman -S --needed \
        webkit2gtk-4.1 \
        gtk3 \
        libappindicator-gtk3 \
        librsvg \
        openssl
    ```

## Verification

After installing all prerequisites, verify your environment:

```bash
# Check Node.js
node --version

# Check pnpm
pnpm --version

# Check Rust (for desktop development)
rustc --version
cargo --version

# Check Tauri CLI (will be installed with project dependencies)
pnpm tauri info
```

## Optional Tools

### Git

Required for cloning the repository and version control.

```bash
git --version
```

### VS Code Extensions

Recommended extensions for development:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete
- **rust-analyzer** - Rust language support
- **Tauri** - Tauri development tools

## Next Steps

Once you have all prerequisites installed, proceed to [Installation](installation.md).
