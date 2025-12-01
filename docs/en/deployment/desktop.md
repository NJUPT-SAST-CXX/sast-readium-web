# Desktop Packaging

This guide covers building and distributing SAST Readium as a desktop application using Tauri.

## Build Command

```bash
pnpm tauri build
```

This command:

1. Builds the Next.js frontend
2. Compiles the Rust backend
3. Creates platform-specific installers

## Output Locations

| Platform | Format   | Path                                        |
| -------- | -------- | ------------------------------------------- |
| Windows  | MSI      | `src-tauri/target/release/bundle/msi/`      |
| Windows  | NSIS     | `src-tauri/target/release/bundle/nsis/`     |
| macOS    | DMG      | `src-tauri/target/release/bundle/dmg/`      |
| macOS    | App      | `src-tauri/target/release/bundle/macos/`    |
| Linux    | AppImage | `src-tauri/target/release/bundle/appimage/` |
| Linux    | Deb      | `src-tauri/target/release/bundle/deb/`      |

## Platform-Specific Builds

### Windows

**Requirements:**

- Windows 10/11
- Visual Studio Build Tools
- Rust toolchain

**Build:**

```bash
pnpm tauri build
```

**Output:**

- `*.msi` - Windows Installer package
- `*.exe` - NSIS installer

**Code Signing (Optional):**

1. Obtain a code signing certificate
2. Convert to base64:
   ```powershell
   $bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
   $base64 = [System.Convert]::ToBase64String($bytes)
   $base64 | Out-File certificate.txt
   ```
3. Add to CI secrets:
   - `WINDOWS_CERTIFICATE`
   - `WINDOWS_CERTIFICATE_PASSWORD`

### macOS

**Requirements:**

- macOS 10.13+
- Xcode Command Line Tools
- Rust toolchain

**Build:**

```bash
# Build for current architecture
pnpm tauri build

# Build for specific architecture
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target aarch64-apple-darwin

# Universal binary (both architectures)
pnpm tauri build --target universal-apple-darwin
```

**Output:**

- `*.dmg` - Disk image
- `*.app` - Application bundle

**Code Signing & Notarization:**

For distribution outside the App Store:

1. Enroll in Apple Developer Program
2. Create "Developer ID Application" certificate
3. Export certificate as .p12
4. Configure in `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
       }
     }
   }
   ```
5. For notarization, add CI secrets:
   - `APPLE_CERTIFICATE`
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_ID`
   - `APPLE_PASSWORD` (app-specific password)
   - `APPLE_TEAM_ID`

### Linux

**Requirements:**

- Ubuntu 20.04+ or equivalent
- System dependencies:
  ```bash
  sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf
  ```

**Build:**

```bash
pnpm tauri build
```

**Output:**

- `*.AppImage` - Portable application
- `*.deb` - Debian package

## Build Options

### Debug Build

Include debug symbols for troubleshooting:

```bash
pnpm tauri build --debug
```

### Specific Bundle Type

Build only specific installer format:

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

### Cross-Compilation

Build for different target:

```bash
# Windows targets
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target i686-pc-windows-msvc

# macOS targets
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target aarch64-apple-darwin

# Linux targets
pnpm tauri build --target x86_64-unknown-linux-gnu
```

## Configuration

### App Metadata

Configure in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "SAST Readium",
  "version": "0.1.0",
  "identifier": "com.sast.readium",
  "bundle": {
    "active": true,
    "category": "Utility",
    "shortDescription": "A modern PDF reader",
    "longDescription": "...",
    "copyright": "Copyright © 2025 SAST"
  }
}
```

### Icons

Place icons in `src-tauri/icons/`:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

Generate icons from a source image:

```bash
pnpm tauri icon path/to/icon.png
```

### Windows Configuration

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

### macOS Configuration

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

### Linux Configuration

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

## Distribution

### Windows Distribution

1. Build the MSI/NSIS installer
2. (Optional) Sign the installer
3. Distribute via:
   - Direct download
   - GitHub Releases
   - Windows Package Manager (winget)

### macOS Distribution

1. Build the DMG
2. Sign and notarize (required for Gatekeeper)
3. Distribute via:
   - Direct download
   - GitHub Releases
   - Homebrew Cask

### Linux Distribution

1. Build AppImage and/or .deb
2. Distribute via:
   - Direct download
   - GitHub Releases
   - Snap Store
   - Flathub
   - AUR (Arch Linux)

## Auto-Updates

Tauri supports automatic updates.

### Configuration

In `tauri.conf.json`:

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

### Update Manifest

Create `latest.json` for each release:

```json
{
  "version": "1.0.0",
  "notes": "Release notes here",
  "pub_date": "2025-01-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/.../app_1.0.0_x64-setup.nsis.zip",
      "signature": "..."
    },
    "darwin-x86_64": {
      "url": "https://github.com/.../app_1.0.0_x64.app.tar.gz",
      "signature": "..."
    }
  }
}
```

## Troubleshooting

### Build Fails

1. Check Tauri environment:
   ```bash
   pnpm tauri info
   ```
2. Update Rust:
   ```bash
   rustup update
   ```
3. Clean build:
   ```bash
   cd src-tauri && cargo clean
   ```

### Missing Dependencies (Linux)

Install required packages:

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

### Code Signing Issues

1. Verify certificate is valid
2. Check certificate password
3. Ensure signing identity matches
4. Review Tauri logs for details
