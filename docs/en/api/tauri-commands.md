# Tauri Commands API

The Tauri commands provide native desktop functionality through Rust backend functions, wrapped in TypeScript for easy use.

## TypeScript Bridge

Import from the bridge module:

```typescript
import {
  isTauri,
  getSystemInfo,
  getAppRuntimeInfo,
  revealInFileManager,
  renameFile,
  deleteFile,
  openFileDialog,
  saveFileDialog,
} from "@/lib/tauri-bridge";
```

## Platform Detection

### isTauri

Check if running in Tauri desktop environment.

```typescript
function isTauri(): boolean;
```

**Example:**

```typescript
if (isTauri()) {
  // Desktop-specific code
  const info = await getSystemInfo();
} else {
  // Web fallback
}
```

## System Information

### getSystemInfo

Get operating system and architecture information.

```typescript
async function getSystemInfo(): Promise<SystemInfo>;

interface SystemInfo {
  os: string; // "windows", "macos", "linux"
  arch: string; // "x86_64", "aarch64"
}
```

**Example:**

```typescript
const info = await getSystemInfo();
console.log(`Running on ${info.os} (${info.arch})`);
```

### getAppRuntimeInfo

Get application runtime information.

```typescript
async function getAppRuntimeInfo(): Promise<AppRuntimeInfo>;

interface AppRuntimeInfo {
  name: string; // Package name
  version: string; // App version
  tauri_version: string; // Tauri version
  debug: boolean; // Debug build
  exe_path?: string; // Executable path
  current_dir?: string; // Working directory
}
```

**Example:**

```typescript
const runtime = await getAppRuntimeInfo();
console.log(`${runtime.name} v${runtime.version}`);
console.log(`Tauri: ${runtime.tauri_version}`);
console.log(`Debug: ${runtime.debug}`);
```

## File Operations

### revealInFileManager

Open the system file manager and highlight the specified file.

```typescript
async function revealInFileManager(path: string): Promise<boolean>;
```

**Parameters:**

- `path` - Absolute path to the file

**Returns:**

- `true` if successful
- `false` if failed

**Example:**

```typescript
const success = await revealInFileManager("/path/to/document.pdf");
if (success) {
  console.log("File manager opened");
}
```

**Platform Behavior:**

- **Windows**: Opens Explorer with file selected
- **macOS**: Opens Finder with file selected
- **Linux**: Opens default file manager in parent directory

### renameFile

Rename a file in the same directory.

```typescript
async function renameFile(path: string, newName: string): Promise<boolean>;
```

**Parameters:**

- `path` - Current absolute path
- `newName` - New filename (without path)

**Returns:**

- `true` if successful
- `false` if failed

**Example:**

```typescript
const success = await renameFile("/documents/old-name.pdf", "new-name.pdf");
```

**Restrictions:**

- New name cannot contain path separators
- File must exist
- Must have write permissions

### deleteFile

Delete a file from the filesystem.

```typescript
async function deleteFile(path: string): Promise<boolean>;
```

**Parameters:**

- `path` - Absolute path to delete

**Returns:**

- `true` if successful
- `false` if failed

**Example:**

```typescript
const success = await deleteFile("/path/to/file.pdf");
if (success) {
  console.log("File deleted");
}
```

## File Dialogs

### openFileDialog

Open a file picker dialog.

```typescript
async function openFileDialog(
  options?: OpenDialogOptions
): Promise<string | null>;

interface OpenDialogOptions {
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  defaultPath?: string;
  multiple?: boolean;
  directory?: boolean;
  title?: string;
}
```

**Example:**

```typescript
const path = await openFileDialog({
  filters: [
    { name: "PDF Files", extensions: ["pdf"] },
    { name: "All Files", extensions: ["*"] },
  ],
  title: "Open PDF",
});

if (path) {
  console.log("Selected:", path);
}
```

### saveFileDialog

Open a save file dialog.

```typescript
async function saveFileDialog(
  options?: SaveDialogOptions
): Promise<string | null>;

interface SaveDialogOptions {
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  defaultPath?: string;
  title?: string;
}
```

**Example:**

```typescript
const path = await saveFileDialog({
  filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  defaultPath: "document.pdf",
  title: "Save PDF",
});

if (path) {
  console.log("Save to:", path);
}
```

## Rust Implementation

The Tauri commands are defined in `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

#[tauri::command]
fn reveal_in_file_manager(path: String) -> bool {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer.exe")
            .arg(format!("/select,{}", path))
            .spawn()
            .is_ok()
    }
    // ... platform-specific implementations
}

#[tauri::command]
fn rename_file(path: String, new_name: String) -> bool {
    // Validation and rename logic
}

#[tauri::command]
fn delete_file(path: String) -> bool {
    fs::remove_file(path).is_ok()
}
```

## Capabilities

Commands require appropriate capabilities in `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "$APPCONFIG/*" },
        { "path": "$DOCUMENT/*" },
        { "path": "$HOME/*" }
      ]
    }
  ]
}
```

## Error Handling

```typescript
try {
  const success = await renameFile(path, newName);
  if (!success) {
    console.error("Rename failed");
  }
} catch (error) {
  console.error("Tauri error:", error);
}
```

## Web Fallbacks

When running in web mode, provide fallbacks:

```typescript
async function openFile(): Promise<File | null> {
  if (isTauri()) {
    const path = await openFileDialog({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      return readFileFromPath(path);
    }
  } else {
    // Web fallback using input element
    return showWebFilePicker();
  }
  return null;
}
```
