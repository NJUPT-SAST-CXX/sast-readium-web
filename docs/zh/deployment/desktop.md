# 桌面打包

本指南涵盖使用 Tauri 构建和分发 SAST Readium 桌面应用程序。

## 构建命令

```bash
pnpm tauri build
```

此命令将：

1. 构建 Next.js 前端
2. 编译 Rust 后端
3. 创建平台特定的安装程序

## 输出位置

| 平台    | 格式     | 路径                                        |
| ------- | -------- | ------------------------------------------- |
| Windows | MSI      | `src-tauri/target/release/bundle/msi/`      |
| Windows | NSIS     | `src-tauri/target/release/bundle/nsis/`     |
| macOS   | DMG      | `src-tauri/target/release/bundle/dmg/`      |
| macOS   | App      | `src-tauri/target/release/bundle/macos/`    |
| Linux   | AppImage | `src-tauri/target/release/bundle/appimage/` |
| Linux   | Deb      | `src-tauri/target/release/bundle/deb/`      |

## 平台特定构建

### Windows

**要求：**

- Windows 10/11
- Visual Studio Build Tools
- Rust 工具链

**构建：**

```bash
pnpm tauri build
```

**输出：**

- `*.msi` - Windows Installer 包
- `*.exe` - NSIS 安装程序

**代码签名（可选）：**

1. 获取代码签名证书
2. 转换为 base64：
   ```powershell
   $bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
   $base64 = [System.Convert]::ToBase64String($bytes)
   $base64 | Out-File certificate.txt
   ```
3. 添加到 CI secrets：
   - `WINDOWS_CERTIFICATE`
   - `WINDOWS_CERTIFICATE_PASSWORD`

### macOS

**要求：**

- macOS 10.13+
- Xcode 命令行工具
- Rust 工具链

**构建：**

```bash
# 为当前架构构建
pnpm tauri build

# 为特定架构构建
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target aarch64-apple-darwin

# 通用二进制（两种架构）
pnpm tauri build --target universal-apple-darwin
```

**输出：**

- `*.dmg` - 磁盘映像
- `*.app` - 应用程序包

### Linux

**要求：**

- Ubuntu 20.04+ 或等效版本
- 系统依赖：
  ```bash
  sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf
  ```

**构建：**

```bash
pnpm tauri build
```

**输出：**

- `*.AppImage` - 便携应用程序
- `*.deb` - Debian 包

## 构建选项

### 调试构建

包含调试符号用于故障排除：

```bash
pnpm tauri build --debug
```

### 特定包类型

仅构建特定安装程序格式：

```bash
# Windows
pnpm tauri build --bundles msi
pnpm tauri build --bundles nsis

# macOS
pnpm tauri build --bundles dmg
pnpm tauri build --bundles app

# Linux
pnpm tauri build --bundles appimage
pnpm tauri build --bundles deb
```

### 交叉编译

为不同目标构建：

```bash
# Windows 目标
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target i686-pc-windows-msvc

# macOS 目标
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target aarch64-apple-darwin

# Linux 目标
pnpm tauri build --target x86_64-unknown-linux-gnu
```

## 配置

### 应用元数据

在 `src-tauri/tauri.conf.json` 中配置：

```json
{
  "productName": "SAST Readium",
  "version": "0.1.0",
  "identifier": "com.sast.readium",
  "bundle": {
    "active": true,
    "category": "Utility",
    "shortDescription": "现代 PDF 阅读器",
    "longDescription": "...",
    "copyright": "Copyright © 2025 SAST"
  }
}
```

### 图标

将图标放在 `src-tauri/icons/`：

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

从源图像生成图标：

```bash
pnpm tauri icon path/to/icon.png
```

### Windows 配置

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "nsis": {
        "installMode": "currentUser",
        "languages": ["English", "SimpChinese"]
      }
    }
  }
}
```

### macOS 配置

```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "10.13",
      "entitlements": null,
      "signingIdentity": null,
      "providerShortName": null
    }
  }
}
```

### Linux 配置

```json
{
  "bundle": {
    "linux": {
      "deb": {
        "depends": [
          "libwebkit2gtk-4.1-0",
          "libgtk-3-0",
          "libappindicator3-1",
          "librsvg2-2"
        ]
      }
    }
  }
}
```

## 分发

### Windows 分发

1. 构建 MSI/NSIS 安装程序
2. （可选）签名安装程序
3. 通过以下方式分发：
   - 直接下载
   - GitHub Releases
   - Windows Package Manager (winget)

### macOS 分发

1. 构建 DMG
2. 签名和公证（Gatekeeper 需要）
3. 通过以下方式分发：
   - 直接下载
   - GitHub Releases
   - Homebrew Cask

### Linux 分发

1. 构建 AppImage 和/或 .deb
2. 通过以下方式分发：
   - 直接下载
   - GitHub Releases
   - Snap Store
   - Flathub
   - AUR (Arch Linux)

## 自动更新

Tauri 支持自动更新。

### 配置

在 `tauri.conf.json` 中：

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/NJUPT-SAST-CXX/sast-readium-web/releases/latest/download/latest.json"
      ],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

## 故障排除

### 构建失败

1. 检查 Tauri 环境：
   ```bash
   pnpm tauri info
   ```
2. 更新 Rust：
   ```bash
   rustup update
   ```
3. 清理构建：
   ```bash
   cd src-tauri && cargo clean
   ```

### 缺少依赖（Linux）

安装所需包：

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

### 代码签名问题

1. 验证证书有效
2. 检查证书密码
3. 确保签名身份匹配
4. 查看 Tauri 日志获取详情
