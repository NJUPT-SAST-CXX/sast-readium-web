//! File operations commands (export, import, metadata, etc.)

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::time::UNIX_EPOCH;
use tauri::Manager;

// ============================================================================
// Data Structures
// ============================================================================

/// Export options passed from frontend
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOptions {
    /// JSON data to export
    pub data: String,
    /// Target file path (if None, will prompt user)
    pub file_path: Option<String>,
    /// File name suggestion for save dialog (reserved for future use)
    #[allow(dead_code)]
    pub file_name: Option<String>,
    /// Whether to pretty print JSON
    pub pretty_print: Option<bool>,
}

/// Export result returned to frontend
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub bytes_written: Option<u64>,
    pub error: Option<String>,
}

/// Import options passed from frontend
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportOptions {
    /// File path to import from (if None, will prompt user)
    pub file_path: Option<String>,
}

/// Import result returned to frontend
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub success: bool,
    pub data: Option<String>,
    pub file_path: Option<String>,
    pub bytes_read: Option<u64>,
    pub error: Option<String>,
}

/// File metadata for recent files
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified_at: Option<u64>,
    pub created_at: Option<u64>,
}

// ============================================================================
// Commands
// ============================================================================

/// Get file metadata
#[tauri::command]
pub fn get_file_metadata(path: String) -> Option<FileMetadata> {
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
#[tauri::command]
pub fn export_data_to_file(options: ExportOptions) -> ExportResult {
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
#[tauri::command]
pub fn import_data_from_file(options: ImportOptions) -> ImportResult {
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
pub fn get_default_export_dir() -> Option<String> {
    dirs::document_dir().and_then(|p| p.to_str().map(|s| s.to_string()))
}

/// Get the app data directory
#[tauri::command]
pub fn get_app_data_dir(app: tauri::AppHandle) -> Option<String> {
    app.path()
        .app_data_dir()
        .ok()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
}

/// Create directory if it doesn't exist
#[tauri::command]
pub fn ensure_directory(path: String) -> bool {
    fs::create_dir_all(&path).is_ok()
}

/// List files in a directory with optional extension filter
#[tauri::command]
pub fn list_files_in_directory(path: String, extension: Option<String>) -> Vec<FileMetadata> {
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
pub fn copy_file(source: String, destination: String) -> bool {
    fs::copy(&source, &destination).is_ok()
}

/// Check if a file exists
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Rename a file (new name only, keeps in same directory)
#[tauri::command]
pub fn rename_file(path: String, new_name: String) -> bool {
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

/// Delete a file
#[tauri::command]
pub fn delete_file(path: String) -> bool {
    let p = Path::new(&path);
    if !p.exists() {
        return false;
    }
    fs::remove_file(p).is_ok()
}

/// Export conversation data to a file
#[tauri::command]
pub fn export_conversation(
    data: String,
    file_name: String,
    app: tauri::AppHandle,
) -> Result<String, AppError> {
    let export_dir = dirs::document_dir()
        .or_else(|| app.path().app_data_dir().ok())
        .ok_or_else(|| AppError::NotFound("Could not find export directory".to_string()))?;

    fs::create_dir_all(&export_dir)?;

    let file_path = export_dir.join(&file_name);

    // Pretty print JSON if possible
    let formatted_data = match serde_json::from_str::<serde_json::Value>(&data) {
        Ok(value) => serde_json::to_string_pretty(&value).unwrap_or(data),
        Err(_) => data,
    };

    fs::write(&file_path, formatted_data)?;
    log::info!("Conversation exported to: {:?}", file_path);

    Ok(file_path.to_string_lossy().to_string())
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::tempdir;

    fn path_to_string(path: &Path) -> String {
        path.to_string_lossy().to_string()
    }

    fn create_temp_file(dir: &tempfile::TempDir, name: &str, contents: &str) -> PathBuf {
        let path = dir.path().join(name);
        fs::write(&path, contents).unwrap();
        path
    }

    #[test]
    fn get_file_metadata_returns_none_for_missing_file() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("missing.json");

        let metadata = get_file_metadata(path_to_string(&path));

        assert!(metadata.is_none());
    }

    #[test]
    fn get_file_metadata_returns_expected_values() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("example.txt");
        fs::write(&path, b"hello world").unwrap();

        let metadata = get_file_metadata(path_to_string(&path)).expect("metadata");

        assert_eq!(metadata.name, "example.txt");
        assert_eq!(metadata.size, 11);
        assert!(metadata.modified_at.is_some());
    }

    #[test]
    fn export_data_to_file_requires_path() {
        let result = export_data_to_file(ExportOptions {
            data: "{}".to_string(),
            file_path: None,
            file_name: None,
            pretty_print: None,
        });

        assert!(!result.success);
        assert!(result.error.unwrap().contains("No file path"));
    }

    #[test]
    fn export_data_to_file_writes_pretty_json() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("export.json");

        let result = export_data_to_file(ExportOptions {
            data: "{\"a\":1}".to_string(),
            file_path: Some(path_to_string(&path)),
            file_name: None,
            pretty_print: Some(true),
        });

        assert!(result.success);
        assert_eq!(fs::read_to_string(&path).unwrap(), "{\n  \"a\": 1\n}");
    }

    #[test]
    fn import_data_from_file_requires_path() {
        let result = import_data_from_file(ImportOptions { file_path: None });

        assert!(!result.success);
        assert!(result.error.unwrap().contains("No file path"));
    }

    #[test]
    fn import_data_from_file_rejects_invalid_json() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("invalid.json");
        fs::write(&path, "not-json").unwrap();

        let result = import_data_from_file(ImportOptions {
            file_path: Some(path_to_string(&path)),
        });

        assert!(!result.success);
        assert!(result.error.unwrap().contains("Invalid JSON"));
    }

    #[test]
    fn import_data_from_file_reads_content() {
        let dir = tempdir().unwrap();
        let path = create_temp_file(&dir, "valid.json", "{\"test\":true}");

        let result = import_data_from_file(ImportOptions {
            file_path: Some(path_to_string(&path)),
        });

        assert!(result.success);
        assert_eq!(result.data.unwrap(), "{\"test\":true}");
    }

    #[test]
    fn ensure_directory_creates_nested_paths() {
        let dir = tempdir().unwrap();
        let nested = dir.path().join("nested/inner");

        assert!(ensure_directory(path_to_string(&nested)));
        assert!(nested.exists());
    }

    #[test]
    fn list_files_in_directory_filters_by_extension() {
        let dir = tempdir().unwrap();
        let _json_file = create_temp_file(&dir, "keep.json", "{}");
        let _txt_file = create_temp_file(&dir, "skip.txt", "text");

        let files = list_files_in_directory(path_to_string(dir.path()), Some("json".to_string()));

        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, "keep.json");
    }

    #[test]
    fn copy_file_and_file_exists_behave_correctly() {
        let dir = tempdir().unwrap();
        let source = create_temp_file(&dir, "source.txt", "hello");
        let dest = dir.path().join("dest.txt");

        assert!(copy_file(path_to_string(&source), path_to_string(&dest)));
        assert!(file_exists(path_to_string(&dest)));
        assert_eq!(fs::read_to_string(&dest).unwrap(), "hello");
    }

    #[test]
    fn rename_file_validates_input_and_renames_file() {
        let dir = tempdir().unwrap();
        let original = dir.path().join("file.txt");
        fs::write(&original, "data").unwrap();

        // Reject invalid name with slash
        assert!(!rename_file(
            path_to_string(&original),
            "../../etc/passwd".to_string()
        ));

        // Rename with valid name
        assert!(rename_file(
            path_to_string(&original),
            "renamed.txt".to_string()
        ));

        assert!(!original.exists());
        assert!(dir.path().join("renamed.txt").exists());
    }

    #[test]
    fn delete_file_returns_false_for_missing_file() {
        let dir = tempdir().unwrap();
        let missing = dir.path().join("missing.bin");

        assert!(!delete_file(path_to_string(&missing)));

        fs::write(&missing, "contents").unwrap();
        assert!(delete_file(path_to_string(&missing)));
        assert!(!missing.exists());
    }

    #[test]
    fn ensure_directory_reused_when_exists() {
        let dir = tempdir().unwrap();
        let nested = dir.path().join("nested");
        fs::create_dir_all(&nested).unwrap();

        assert!(ensure_directory(path_to_string(&nested)));
        assert!(nested.exists());
    }
}
