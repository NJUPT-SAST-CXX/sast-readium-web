//! System information and utility commands

use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct SystemInfo {
    os: String,
    arch: String,
}

#[derive(Serialize)]
pub struct AppRuntimeInfo {
    name: String,
    version: String,
    tauri_version: String,
    debug: bool,
    exe_path: Option<String>,
    current_dir: Option<String>,
}

/// Get system information (OS and architecture)
#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

/// Get application runtime information
#[tauri::command]
pub fn get_app_runtime_info() -> AppRuntimeInfo {
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

/// Reveal a file in the system file manager
#[tauri::command]
pub fn reveal_in_file_manager(path: String) -> bool {
    #[cfg(target_os = "windows")]
    {
        let arg = format!("/select,{}", path);
        return Command::new("explorer.exe").arg(arg).spawn().is_ok();
    }

    #[cfg(target_os = "macos")]
    {
        return Command::new("open").arg("-R").arg(&path).spawn().is_ok();
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let p = Path::new(&path);
        let dir = p.parent().unwrap_or(p);
        return Command::new("xdg-open").arg(dir).spawn().is_ok();
    }

    #[allow(unreachable_code)]
    false
}
