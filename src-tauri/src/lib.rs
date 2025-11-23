use serde::Serialize;
use std::fs;
use std::path::Path;
use std::process::Command;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_app_runtime_info,
            reveal_in_file_manager,
            rename_file,
            delete_file
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
