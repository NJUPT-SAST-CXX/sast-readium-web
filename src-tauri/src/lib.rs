use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::process::Command;
use std::time::UNIX_EPOCH;
use tauri::Manager;

#[derive(Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
}

#[derive(Serialize)]
struct AppRuntimeInfo {
    name: String,
    version: String,
    tauri_version: String,
    debug: bool,
    exe_path: Option<String>,
    current_dir: Option<String>,
}

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
        // On Windows, use explorer with /select to highlight the file.
        let arg = format!("/select,{}", path);
        return Command::new("explorer.exe").arg(arg).spawn().is_ok();
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, use `open -R` to reveal the file in Finder.
        return Command::new("open").arg("-R").arg(&path).spawn().is_ok();
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        use std::path::Path;
        let p = Path::new(&path);
        let dir = p.parent().unwrap_or(p);
        return Command::new("xdg-open").arg(dir).spawn().is_ok();
    }

    #[allow(unreachable_code)]
    false
}

#[tauri::command]
fn rename_file(path: String, new_name: String) -> bool {
    let trimmed = new_name.trim();
    if trimmed.is_empty() {
        return false;
    }

    // Disallow directory separators to keep the file in the same folder
    if trimmed.contains('/') || trimmed.contains('\\') {
        return false;
    }

    let original = Path::new(&path);
    let parent = match original.parent() {
        Some(p) => p,
        None => return false,
    };

    let target = parent.join(trimmed);
    fs::rename(original, target).is_ok()
}

#[tauri::command]
fn delete_file(path: String) -> bool {
    let p = Path::new(&path);
    if !p.exists() {
        return false;
    }
    fs::remove_file(p).is_ok()
}

#[tauri::command]
fn get_app_runtime_info() -> AppRuntimeInfo {
    let exe_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(|s| s.to_string()));
    let current_dir = std::env::current_dir()
        .ok()
        .and_then(|p| p.to_str().map(|s| s.to_string()));

    AppRuntimeInfo {
        name: env!("CARGO_PKG_NAME").to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        tauri_version: tauri::VERSION.to_string(),
        debug: cfg!(debug_assertions),
        exe_path,
        current_dir,
    }
}

// ============================================================================
// Data Export/Import Commands
// ============================================================================

/// Export options passed from frontend
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportOptions {
    /// JSON data to export
    data: String,
    /// Target file path (if None, will prompt user)
    file_path: Option<String>,
    /// File name suggestion for save dialog (reserved for future use)
    #[allow(dead_code)]
    file_name: Option<String>,
    /// Whether to pretty print JSON
    pretty_print: Option<bool>,
}

/// Export result returned to frontend
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportResult {
    success: bool,
    file_path: Option<String>,
    bytes_written: Option<u64>,
    error: Option<String>,
}

/// Import options passed from frontend
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportOptions {
    /// File path to import from (if None, will prompt user)
    file_path: Option<String>,
}

/// Import result returned to frontend
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportResult {
    success: bool,
    data: Option<String>,
    file_path: Option<String>,
    bytes_read: Option<u64>,
    error: Option<String>,
}

/// File metadata for recent files
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    path: String,
    name: String,
    size: u64,
    modified_at: Option<u64>,
    created_at: Option<u64>,
}

/// Get file metadata
#[tauri::command]
fn get_file_metadata(path: String) -> Option<FileMetadata> {
    let p = Path::new(&path);
    if !p.exists() {
        return None;
    }

    let metadata = fs::metadata(p).ok()?;
    let name = p.file_name()?.to_str()?.to_string();

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    let created_at = metadata
        .created()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Some(FileMetadata {
        path,
        name,
        size: metadata.len(),
        modified_at,
        created_at,
    })
}

/// Export data to a file
/// If file_path is provided, writes directly to that path.
/// Otherwise, the frontend should use the dialog plugin to get a path first.
#[tauri::command]
fn export_data_to_file(options: ExportOptions) -> ExportResult {
    let file_path = match options.file_path {
        Some(path) => path,
        None => {
            return ExportResult {
                success: false,
                file_path: None,
                bytes_written: None,
                error: Some("No file path provided. Use dialog to select path first.".to_string()),
            };
        }
    };

    // Format JSON if requested
    let data_to_write = if options.pretty_print.unwrap_or(true) {
        // Try to parse and re-format as pretty JSON
        match serde_json::from_str::<serde_json::Value>(&options.data) {
            Ok(value) => serde_json::to_string_pretty(&value).unwrap_or(options.data),
            Err(_) => options.data,
        }
    } else {
        options.data
    };

    // Write to file
    match File::create(&file_path) {
        Ok(mut file) => {
            let bytes = data_to_write.as_bytes();
            match file.write_all(bytes) {
                Ok(_) => ExportResult {
                    success: true,
                    file_path: Some(file_path),
                    bytes_written: Some(bytes.len() as u64),
                    error: None,
                },
                Err(e) => ExportResult {
                    success: false,
                    file_path: Some(file_path),
                    bytes_written: None,
                    error: Some(format!("Failed to write file: {}", e)),
                },
            }
        }
        Err(e) => ExportResult {
            success: false,
            file_path: Some(file_path),
            bytes_written: None,
            error: Some(format!("Failed to create file: {}", e)),
        },
    }
}

/// Import data from a file
/// If file_path is provided, reads from that path.
/// Otherwise, the frontend should use the dialog plugin to get a path first.
#[tauri::command]
fn import_data_from_file(options: ImportOptions) -> ImportResult {
    let file_path = match options.file_path {
        Some(path) => path,
        None => {
            return ImportResult {
                success: false,
                data: None,
                file_path: None,
                bytes_read: None,
                error: Some("No file path provided. Use dialog to select path first.".to_string()),
            };
        }
    };

    let p = Path::new(&file_path);
    if !p.exists() {
        return ImportResult {
            success: false,
            data: None,
            file_path: Some(file_path),
            bytes_read: None,
            error: Some("File does not exist".to_string()),
        };
    }

    // Read file content
    match File::open(&file_path) {
        Ok(mut file) => {
            let mut content = String::new();
            match file.read_to_string(&mut content) {
                Ok(bytes) => {
                    // Validate JSON
                    match serde_json::from_str::<serde_json::Value>(&content) {
                        Ok(_) => ImportResult {
                            success: true,
                            data: Some(content),
                            file_path: Some(file_path),
                            bytes_read: Some(bytes as u64),
                            error: None,
                        },
                        Err(e) => ImportResult {
                            success: false,
                            data: None,
                            file_path: Some(file_path),
                            bytes_read: Some(bytes as u64),
                            error: Some(format!("Invalid JSON: {}", e)),
                        },
                    }
                }
                Err(e) => ImportResult {
                    success: false,
                    data: None,
                    file_path: Some(file_path),
                    bytes_read: None,
                    error: Some(format!("Failed to read file: {}", e)),
                },
            }
        }
        Err(e) => ImportResult {
            success: false,
            data: None,
            file_path: Some(file_path),
            bytes_read: None,
            error: Some(format!("Failed to open file: {}", e)),
        },
    }
}

/// Get the default export directory (Documents folder)
#[tauri::command]
fn get_default_export_dir() -> Option<String> {
    dirs::document_dir().and_then(|p| p.to_str().map(|s| s.to_string()))
}

/// Get the app data directory
#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Option<String> {
    app.path()
        .app_data_dir()
        .ok()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
}

/// Create directory if it doesn't exist
#[tauri::command]
fn ensure_directory(path: String) -> bool {
    fs::create_dir_all(&path).is_ok()
}

/// List files in a directory with optional extension filter
#[tauri::command]
fn list_files_in_directory(path: String, extension: Option<String>) -> Vec<FileMetadata> {
    let dir_path = Path::new(&path);
    if !dir_path.exists() || !dir_path.is_dir() {
        return Vec::new();
    }

    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if !entry_path.is_file() {
                continue;
            }

            // Filter by extension if provided
            if let Some(ref ext) = extension {
                if let Some(file_ext) = entry_path.extension() {
                    if file_ext.to_str() != Some(ext.as_str()) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            if let Some(metadata) = get_file_metadata(entry_path.to_string_lossy().to_string()) {
                files.push(metadata);
            }
        }
    }

    // Sort by modified time, newest first
    files.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    files
}

/// Copy file to a new location
#[tauri::command]
fn copy_file(source: String, destination: String) -> bool {
    fs::copy(&source, &destination).is_ok()
}

/// Check if a file exists
#[tauri::command]
fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder =
        tauri::Builder::default().plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = tauri::Builder::default();

    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_app_runtime_info,
            reveal_in_file_manager,
            rename_file,
            delete_file,
            // Data export/import commands
            export_data_to_file,
            import_data_from_file,
            get_file_metadata,
            get_default_export_dir,
            get_app_data_dir,
            ensure_directory,
            list_files_in_directory,
            copy_file,
            file_exists
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
