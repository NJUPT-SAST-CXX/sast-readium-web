# 前置要求

在开始使用 SAST Readium 开发之前，请确保您的系统已安装以下工具。

## Web 开发要求

### Node.js

**版本**: 20.x 或更高

Node.js 用于运行 Next.js 开发服务器和构建工具。

=== "Windows"

    从 [nodejs.org](https://nodejs.org/) 下载并安装

=== "macOS"

    ```bash
    # 使用 Homebrew
    brew install node@20
    ```

=== "Linux"

    ```bash
    # 使用 nvm（推荐）
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    nvm install 20
    nvm use 20
    ```

验证安装：

```bash
node --version  # 应输出 v20.x.x 或更高
npm --version   # 应输出 10.x.x 或更高
```

### pnpm

**版本**: 8.x 或更高（推荐）

pnpm 是本项目推荐的包管理器，因其速度快且节省磁盘空间。

```bash
npm install -g pnpm
```

验证安装：

```bash
pnpm --version  # 应输出 8.x.x 或更高
```

## 桌面开发要求

要使用 Tauri 构建原生桌面应用，需要额外的系统依赖。

### Rust

**版本**: 1.70 或更高

Rust 用于编译 Tauri 后端。

=== "Windows"

    下载并运行 [rustup-init.exe](https://win.rustup.rs/)

=== "macOS / Linux"

    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```

验证安装：

```bash
rustc --version  # 应输出 1.70.x 或更高
cargo --version  # 应输出 1.70.x 或更高
```

### 平台特定依赖

=== "Windows"

    **Microsoft Visual Studio C++ 生成工具**

    1. 下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
    2. 运行安装程序
    3. 选择"使用 C++ 的桌面开发"工作负载
    4. 确保选中"Windows 10/11 SDK"

=== "macOS"

    **Xcode 命令行工具**

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

## 验证

安装所有前置要求后，验证您的环境：

```bash
# 检查 Node.js
node --version

# 检查 pnpm
pnpm --version

# 检查 Rust（用于桌面开发）
rustc --version
cargo --version

# 检查 Tauri CLI（将随项目依赖安装）
pnpm tauri info
```

## 下一步

安装所有前置要求后，继续 [安装](installation.md)。
