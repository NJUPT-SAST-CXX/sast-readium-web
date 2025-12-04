//! SAST Readium - Tauri Backend
//!
//! This module provides the Rust backend for the SAST Readium application.
//! It is organized into the following submodules:
//!
//! - `error` - Application error types
//! - `commands` - Tauri command handlers organized by feature:
//!   - `system` - System information and utilities
//!   - `file_ops` - File operations (export, import, metadata)
//!   - `ai_keys` - AI API key secure storage
//!   - `ai_usage` - AI usage statistics
//!   - `ai_proxy` - AI request proxying
//!   - `mcp` - MCP server management and configuration (with official SDK support)

pub mod commands;
pub mod error;

use commands::mcp::{create_mcp_client_state, MCPServerState, MCPState};
use std::sync::{Arc, Mutex};

// Re-export error type for convenience
pub use error::AppError;

// Re-export MCP types that need to be public
pub use commands::mcp::{MCPClientInfo, MCPServerConfig, MCPServerStatus};

/// Application entry point
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder =
        tauri::Builder::default().plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = tauri::Builder::default();

    // Initialize MCP server state (legacy process management)
    let mcp_state: MCPState = Arc::new(Mutex::new(MCPServerState::default()));

    // Initialize MCP client state (official SDK)
    let mcp_client_state = create_mcp_client_state();

    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(mcp_state)
        .manage(mcp_client_state)
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::system::get_system_info,
            commands::system::get_app_runtime_info,
            commands::system::reveal_in_file_manager,
            // File operations
            commands::file_ops::rename_file,
            commands::file_ops::delete_file,
            commands::file_ops::export_data_to_file,
            commands::file_ops::import_data_from_file,
            commands::file_ops::get_file_metadata,
            commands::file_ops::get_default_export_dir,
            commands::file_ops::get_app_data_dir,
            commands::file_ops::ensure_directory,
            commands::file_ops::list_files_in_directory,
            commands::file_ops::copy_file,
            commands::file_ops::file_exists,
            commands::file_ops::export_conversation,
            // AI API key secure storage
            commands::ai_keys::save_api_key,
            commands::ai_keys::get_api_key,
            commands::ai_keys::delete_api_key,
            // AI usage statistics
            commands::ai_usage::get_ai_usage_stats,
            commands::ai_usage::clear_ai_usage_stats,
            commands::ai_usage::update_ai_usage_stats,
            // AI proxy request
            commands::ai_proxy::proxy_ai_request,
            // MCP server management (legacy)
            commands::mcp::start_mcp_server,
            commands::mcp::stop_mcp_server,
            commands::mcp::get_mcp_server_statuses,
            commands::mcp::send_mcp_message,
            commands::mcp::get_mcp_server_presets,
            // MCP configuration persistence and import/export
            commands::mcp::get_saved_mcp_servers,
            commands::mcp::save_mcp_servers,
            commands::mcp::add_mcp_server,
            commands::mcp::update_mcp_server,
            commands::mcp::delete_mcp_server,
            commands::mcp::import_mcp_servers,
            commands::mcp::import_mcp_servers_from_file,
            commands::mcp::export_mcp_servers,
            commands::mcp::export_mcp_servers_to_file,
            commands::mcp::export_mcp_servers_claude_format,
            commands::mcp::detect_external_mcp_configs,
            // MCP client commands (official SDK)
            commands::mcp::commands::mcp_connect,
            commands::mcp::commands::mcp_connect_from_config,
            commands::mcp::commands::mcp_disconnect,
            commands::mcp::commands::mcp_disconnect_all,
            commands::mcp::commands::mcp_get_connected_clients,
            commands::mcp::commands::mcp_list_tools,
            commands::mcp::commands::mcp_list_resources,
            commands::mcp::commands::mcp_list_prompts,
            commands::mcp::commands::mcp_call_tool,
            commands::mcp::commands::mcp_read_resource,
            commands::mcp::commands::mcp_get_prompt
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
