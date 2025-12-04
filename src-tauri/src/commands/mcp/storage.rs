//! MCP server configuration storage commands

use super::types::{MCPServerConfig, MCPServersStore};
use crate::error::AppError;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use uuid::Uuid;

// ============================================================================
// Helper Functions
// ============================================================================

/// Get the MCP servers storage file path
pub fn get_mcp_servers_path(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::NotFound(e.to_string()))?;
    fs::create_dir_all(&data_dir)?;
    Ok(data_dir.join("mcp_servers.json"))
}

/// Load MCP servers from storage
pub fn load_mcp_servers_from_file(path: &Path) -> Result<MCPServersStore, AppError> {
    if !path.exists() {
        return Ok(MCPServersStore::default());
    }
    let content = fs::read_to_string(path)?;
    let store: MCPServersStore = serde_json::from_str(&content)?;
    Ok(store)
}

/// Save MCP servers to storage
pub fn save_mcp_servers_to_file(path: &Path, store: &MCPServersStore) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(store)?;
    fs::write(path, content)?;
    Ok(())
}

// ============================================================================
// Commands
// ============================================================================

/// Get saved MCP servers
#[tauri::command]
pub fn get_saved_mcp_servers(app: tauri::AppHandle) -> Result<Vec<MCPServerConfig>, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let store = load_mcp_servers_from_file(&path)?;
    Ok(store.servers)
}

/// Save MCP servers (replace all)
#[tauri::command]
pub fn save_mcp_servers(app: tauri::AppHandle, servers: Vec<MCPServerConfig>) -> Result<(), AppError> {
    let path = get_mcp_servers_path(&app)?;
    let store = MCPServersStore {
        version: 1,
        servers,
        updated_at: chrono::Utc::now().timestamp(),
    };
    save_mcp_servers_to_file(&path, &store)?;
    log::info!("MCP servers saved: {} servers", store.servers.len());
    Ok(())
}

/// Add a single MCP server
#[tauri::command]
pub fn add_mcp_server(
    app: tauri::AppHandle,
    server: MCPServerConfig,
) -> Result<MCPServerConfig, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let mut store = load_mcp_servers_from_file(&path)?;

    // Check for duplicate by name
    if store.servers.iter().any(|s| s.name == server.name) {
        return Err(AppError::Mcp(format!(
            "Server with name '{}' already exists",
            server.name
        )));
    }

    let mut new_server = server;
    if new_server.id.is_empty() {
        new_server.id = format!("mcp_{}", Uuid::new_v4());
    }
    let now = chrono::Utc::now().timestamp();
    if new_server.created_at == 0 {
        new_server.created_at = now;
    }
    new_server.updated_at = now;

    store.servers.push(new_server.clone());
    store.version = 1;
    store.updated_at = now;

    save_mcp_servers_to_file(&path, &store)?;
    log::info!("MCP server added: {}", new_server.name);
    Ok(new_server)
}

/// Update an existing MCP server
#[tauri::command]
pub fn update_mcp_server(
    app: tauri::AppHandle,
    server: MCPServerConfig,
) -> Result<MCPServerConfig, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let mut store = load_mcp_servers_from_file(&path)?;

    let index = store
        .servers
        .iter()
        .position(|s| s.id == server.id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server.id)))?;

    let mut updated_server = server;
    updated_server.updated_at = chrono::Utc::now().timestamp();

    store.servers[index] = updated_server.clone();
    store.updated_at = chrono::Utc::now().timestamp();

    save_mcp_servers_to_file(&path, &store)?;
    log::info!("MCP server updated: {}", updated_server.name);
    Ok(updated_server)
}

/// Delete an MCP server
#[tauri::command]
pub fn delete_mcp_server(app: tauri::AppHandle, server_id: String) -> Result<(), AppError> {
    let path = get_mcp_servers_path(&app)?;
    let mut store = load_mcp_servers_from_file(&path)?;

    let original_len = store.servers.len();
    store.servers.retain(|s| s.id != server_id);

    if store.servers.len() == original_len {
        return Err(AppError::NotFound(format!(
            "Server '{}' not found",
            server_id
        )));
    }

    store.updated_at = chrono::Utc::now().timestamp();
    save_mcp_servers_to_file(&path, &store)?;
    log::info!("MCP server deleted: {}", server_id);
    Ok(())
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn mcp_servers_store_round_trip() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("mcp_servers.json");
        let now = chrono::Utc::now().timestamp();

        let store = MCPServersStore {
            version: 1,
            servers: vec![MCPServerConfig {
                id: "test_server".to_string(),
                name: "Test Server".to_string(),
                server_type: "stdio".to_string(),
                enabled: true,
                command: Some("npx".to_string()),
                args: Some(vec!["-y".to_string(), "test-mcp".to_string()]),
                env: None,
                url: None,
                headers: None,
                description: Some("Test description".to_string()),
                created_at: now,
                updated_at: now,
            }],
            updated_at: now,
        };

        save_mcp_servers_to_file(&path, &store).unwrap();
        let loaded = load_mcp_servers_from_file(&path).unwrap();

        assert_eq!(loaded.version, 1);
        assert_eq!(loaded.servers.len(), 1);
        assert_eq!(loaded.servers[0].name, "Test Server");
        assert_eq!(loaded.servers[0].command, Some("npx".to_string()));
    }

    #[test]
    fn load_mcp_servers_defaults_when_missing() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("missing.json");

        let store = load_mcp_servers_from_file(&path).unwrap();

        assert_eq!(store.version, 0);
        assert!(store.servers.is_empty());
    }
}
