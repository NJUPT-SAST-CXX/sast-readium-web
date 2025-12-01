# Tauri 命令 API

Tauri 命令通过 Rust 后端函数提供原生桌面功能，封装在 TypeScript 中便于使用。

## TypeScript 桥接

从桥接模块导入：

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

## 平台检测

### isTauri

检查是否在 Tauri 桌面环境中运行。

```typescript
function isTauri(): boolean;
```

**示例：**

```typescript
if (isTauri()) {
  // 桌面特定代码
  const info = await getSystemInfo();
} else {
  // Web 回退
}
```

## 系统信息

### getSystemInfo

获取操作系统和架构信息。

```typescript
async function getSystemInfo(): Promise<SystemInfo>;

interface SystemInfo {
  os: string; // "windows", "macos", "linux"
  arch: string; // "x86_64", "aarch64"
}
```

**示例：**

```typescript
const info = await getSystemInfo();
console.log(`运行在 ${info.os} (${info.arch})`);
```

### getAppRuntimeInfo

获取应用程序运行时信息。

```typescript
async function getAppRuntimeInfo(): Promise<AppRuntimeInfo>;

interface AppRuntimeInfo {
  name: string; // 包名
  version: string; // 应用版本
  tauri_version: string; // Tauri 版本
  debug: boolean; // 调试构建
  exe_path?: string; // 可执行文件路径
  current_dir?: string; // 工作目录
}
```

**示例：**

```typescript
const runtime = await getAppRuntimeInfo();
console.log(`${runtime.name} v${runtime.version}`);
console.log(`Tauri: ${runtime.tauri_version}`);
console.log(`调试: ${runtime.debug}`);
```

## 文件操作

### revealInFileManager

打开系统文件管理器并高亮显示指定文件。

```typescript
async function revealInFileManager(path: string): Promise<boolean>;
```

**参数：**

- `path` - 文件的绝对路径

**返回：**

- `true` 如果成功
- `false` 如果失败

**示例：**

```typescript
const success = await revealInFileManager("/path/to/document.pdf");
if (success) {
  console.log("文件管理器已打开");
}
```

**平台行为：**

- **Windows**: 打开资源管理器并选中文件
- **macOS**: 打开 Finder 并选中文件
- **Linux**: 在父目录打开默认文件管理器

### renameFile

在同一目录中重命名文件。

```typescript
async function renameFile(path: string, newName: string): Promise<boolean>;
```

**参数：**

- `path` - 当前绝对路径
- `newName` - 新文件名（不含路径）

**返回：**

- `true` 如果成功
- `false` 如果失败

**示例：**

```typescript
const success = await renameFile("/documents/old-name.pdf", "new-name.pdf");
```

**限制：**

- 新名称不能包含路径分隔符
- 文件必须存在
- 必须有写入权限

### deleteFile

从文件系统删除文件。

```typescript
async function deleteFile(path: string): Promise<boolean>;
```

**参数：**

- `path` - 要删除的绝对路径

**返回：**

- `true` 如果成功
- `false` 如果失败

**示例：**

```typescript
const success = await deleteFile("/path/to/file.pdf");
if (success) {
  console.log("文件已删除");
}
```

## 文件对话框

### openFileDialog

打开文件选择对话框。

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

**示例：**

```typescript
const path = await openFileDialog({
  filters: [
    { name: "PDF 文件", extensions: ["pdf"] },
    { name: "所有文件", extensions: ["*"] },
  ],
  title: "打开 PDF",
});

if (path) {
  console.log("已选择:", path);
}
```

### saveFileDialog

打开保存文件对话框。

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

**示例：**

```typescript
const path = await saveFileDialog({
  filters: [{ name: "PDF 文件", extensions: ["pdf"] }],
  defaultPath: "document.pdf",
  title: "保存 PDF",
});

if (path) {
  console.log("保存到:", path);
}
```

## Rust 实现

Tauri 命令在 `src-tauri/src/lib.rs` 中定义：

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
    // ... 平台特定实现
}

#[tauri::command]
fn rename_file(path: String, new_name: String) -> bool {
    // 验证和重命名逻辑
}

#[tauri::command]
fn delete_file(path: String) -> bool {
    fs::remove_file(path).is_ok()
}
```

## 能力配置

命令需要在 `src-tauri/capabilities/default.json` 中配置适当的能力：

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

## 错误处理

```typescript
try {
  const success = await renameFile(path, newName);
  if (!success) {
    console.error("重命名失败");
  }
} catch (error) {
  console.error("Tauri 错误:", error);
}
```

## Web 回退

在 Web 模式下运行时，提供回退：

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
    // Web 回退使用 input 元素
    return showWebFilePicker();
  }
  return null;
}
```
