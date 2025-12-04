//! MCP configuration import/export commands

use super::storage::{get_mcp_servers_path, load_mcp_servers_from_file, save_mcp_servers_to_file};
use super::types::{
    ClaudeDesktopMCPServer, MCPConfigSource, MCPExportResult, MCPImportPayload, MCPImportResult,
    MCPServerConfig, MCPServersStore,
};
use crate::error::AppError;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use uuid::Uuid;

// ============================================================================
// Helper Functions
// ============================================================================

/// Convert Claude Desktop format to internal format
pub fn convert_claude_desktop_server(name: &str, server: &ClaudeDesktopMCPServer) -> MCPServerConfig {
    let now = chrono::Utc::now().timestamp();
    let server_type = server.server_type.clone().unwrap_or_else(|| {
        if server.command.is_some() {
            "stdio".to_string()
        } else if server.url.is_some() {
            "http".to_string()
        } else {
            "stdio".to_string()
        }
    });

    MCPServerConfig {
        id: format!(
            "imported_{}_{}",
            name.to_lowercase().replace(' ', "_"),
            Uuid::new_v4()
        ),
        name: name.to_string(),
        server_type,
        enabled: false, // Imported servers start disabled for safety
        command: server.command.clone(),
        args: server.args.clone(),
        env: server.env.clone(),
        url: server.url.clone(),
        headers: server.headers.clone(),
        description: Some("Imported from external configuration".to_string()),
        created_at: now,
        updated_at: now,
    }
}

/// Parse and validate import data from various formats
pub fn parse_mcp_import_data(data: &str) -> Result<Vec<MCPServerConfig>, AppError> {
    let payload: MCPImportPayload = serde_json::from_str(data).map_err(AppError::Json)?;

    let mut servers = Vec::new();

    // Handle direct servers array format
    if let Some(direct_servers) = payload.servers {
        for mut server in direct_servers {
            // Ensure server has an ID
            if server.id.is_empty() {
                server.id = format!("imported_{}", Uuid::new_v4());
            }
            // Ensure timestamps
            let now = chrono::Utc::now().timestamp();
            if server.created_at == 0 {
                server.created_at = now;
            }
            if server.updated_at == 0 {
                server.updated_at = now;
            }
            servers.push(server);
        }
    }

    // Handle Claude Desktop mcpServers format
    if let Some(mcp_servers) = payload.mcp_servers {
        for (name, server) in mcp_servers {
            servers.push(convert_claude_desktop_server(&name, &server));
        }
    }

    Ok(servers)
}

// ============================================================================
// Commands
// ============================================================================

/// Import MCP servers from JSON data
#[tauri::command]
pub fn import_mcp_servers(
    app: tauri::AppHandle,
    data: String,
    merge: bool,
) -> Result<MCPImportResult, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let mut store = if merge {
        load_mcp_servers_from_file(&path)?
    } else {
        MCPServersStore::default()
    };

    let imported_servers = parse_mcp_import_data(&data)?;

    let mut imported_count = 0;
    let mut skipped_count = 0;
    let mut errors = Vec::new();

    for server in imported_servers {
        // Check for duplicate by name when merging
        if merge && store.servers.iter().any(|s| s.name == server.name) {
            skipped_count += 1;
            errors.push(format!("Skipped '{}': already exists", server.name));
            continue;
        }

        // Validate required fields
        if server.server_type == "stdio" && server.command.is_none() {
            skipped_count += 1;
            errors.push(format!(
                "Skipped '{}': stdio server requires command",
                server.name
            ));
            continue;
        }
        if (server.server_type == "http" || server.server_type == "sse") && server.url.is_none() {
            skipped_count += 1;
            errors.push(format!(
                "Skipped '{}': {} server requires url",
                server.name, server.server_type
            ));
            continue;
        }

        store.servers.push(server);
        imported_count += 1;
    }

    store.version = 1;
    store.updated_at = chrono::Utc::now().timestamp();
    save_mcp_servers_to_file(&path, &store)?;

    log::info!(
        "MCP servers imported: {} imported, {} skipped",
        imported_count,
        skipped_count
    );

    Ok(MCPImportResult {
        success: imported_count > 0 || skipped_count == 0,
        imported_count,
        skipped_count,
        errors,
        servers: store.servers,
    })
}

/// Import MCP servers from a file path
#[tauri::command]
pub fn import_mcp_servers_from_file(
    app: tauri::AppHandle,
    file_path: String,
    merge: bool,
) -> Result<MCPImportResult, AppError> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(AppError::NotFound(format!("File not found: {}", file_path)));
    }

    let data = fs::read_to_string(path)?;
    import_mcp_servers(app, data, merge)
}

/// Export MCP servers to JSON string
#[tauri::command]
pub fn export_mcp_servers(app: tauri::AppHandle) -> Result<String, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let store = load_mcp_servers_from_file(&path)?;

    let export_data = serde_json::json!({
        "version": 1,
        "source": "sast-readium",
        "exportedAt": chrono::Utc::now().timestamp(),
        "servers": store.servers
    });

    Ok(serde_json::to_string_pretty(&export_data)?)
}

/// Export MCP servers to a file
#[tauri::command]
pub fn export_mcp_servers_to_file(
    app: tauri::AppHandle,
    file_path: String,
) -> Result<MCPExportResult, AppError> {
    let storage_path = get_mcp_servers_path(&app)?;
    let store = load_mcp_servers_from_file(&storage_path)?;

    let export_data = serde_json::json!({
        "version": 1,
        "source": "sast-readium",
        "exportedAt": chrono::Utc::now().timestamp(),
        "servers": store.servers
    });

    let content = serde_json::to_string_pretty(&export_data)?;
    fs::write(&file_path, content)?;

    log::info!("MCP servers exported to: {}", file_path);

    Ok(MCPExportResult {
        success: true,
        file_path: Some(file_path),
        server_count: store.servers.len(),
        error: None,
    })
}

/// Export MCP servers in Claude Desktop format
#[tauri::command]
pub fn export_mcp_servers_claude_format(app: tauri::AppHandle) -> Result<String, AppError> {
    let path = get_mcp_servers_path(&app)?;
    let store = load_mcp_servers_from_file(&path)?;

    let mut mcp_servers: HashMap<String, serde_json::Value> = HashMap::new();

    for server in store.servers {
        let mut server_obj = serde_json::Map::new();

        if let Some(command) = server.command {
            server_obj.insert("command".to_string(), serde_json::Value::String(command));
        }
        if let Some(args) = server.args {
            server_obj.insert("args".to_string(), serde_json::json!(args));
        }
        if let Some(env) = server.env {
            server_obj.insert("env".to_string(), serde_json::json!(env));
        }
        if let Some(url) = server.url {
            server_obj.insert("url".to_string(), serde_json::Value::String(url));
        }
        if let Some(headers) = server.headers {
            server_obj.insert("headers".to_string(), serde_json::json!(headers));
        }

        mcp_servers.insert(server.name, serde_json::Value::Object(server_obj));
    }

    let export_data = serde_json::json!({
        "mcpServers": mcp_servers
    });

    Ok(serde_json::to_string_pretty(&export_data)?)
}

/// Detect and list available MCP config files from known IDE locations
#[tauri::command]
pub fn detect_external_mcp_configs() -> Vec<MCPConfigSource> {
    let mut sources = Vec::new();

    // Claude Desktop config locations
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let claude_path =
                home.join("Library/Application Support/Claude/claude_desktop_config.json");
            if claude_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Claude Desktop".to_string(),
                    path: claude_path.to_string_lossy().to_string(),
                    source_type: "claude-desktop".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = dirs::config_dir() {
            let claude_path = appdata.join("Claude/claude_desktop_config.json");
            if claude_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Claude Desktop".to_string(),
                    path: claude_path.to_string_lossy().to_string(),
                    source_type: "claude-desktop".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(config) = dirs::config_dir() {
            let claude_path = config.join("Claude/claude_desktop_config.json");
            if claude_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Claude Desktop".to_string(),
                    path: claude_path.to_string_lossy().to_string(),
                    source_type: "claude-desktop".to_string(),
                });
            }
        }
    }

    // VS Code MCP extension config
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let vscode_path = home.join(
                "Library/Application Support/Code/User/globalStorage/anthropic.claude-mcp/mcp_servers.json",
            );
            if vscode_path.exists() {
                sources.push(MCPConfigSource {
                    name: "VS Code MCP Extension".to_string(),
                    path: vscode_path.to_string_lossy().to_string(),
                    source_type: "vscode".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = dirs::config_dir() {
            let vscode_path =
                appdata.join("Code/User/globalStorage/anthropic.claude-mcp/mcp_servers.json");
            if vscode_path.exists() {
                sources.push(MCPConfigSource {
                    name: "VS Code MCP Extension".to_string(),
                    path: vscode_path.to_string_lossy().to_string(),
                    source_type: "vscode".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(config) = dirs::config_dir() {
            let vscode_path =
                config.join("Code/User/globalStorage/anthropic.claude-mcp/mcp_servers.json");
            if vscode_path.exists() {
                sources.push(MCPConfigSource {
                    name: "VS Code MCP Extension".to_string(),
                    path: vscode_path.to_string_lossy().to_string(),
                    source_type: "vscode".to_string(),
                });
            }
        }
    }

    // Cursor IDE config
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let cursor_path = home.join(
                "Library/Application Support/Cursor/User/globalStorage/anthropic.claude-mcp/mcp_servers.json",
            );
            if cursor_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE".to_string(),
                    path: cursor_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
            // Alternative Cursor config location
            let cursor_alt_path = home.join(".cursor/mcp.json");
            if cursor_alt_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE (User Config)".to_string(),
                    path: cursor_alt_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = dirs::config_dir() {
            let cursor_path =
                appdata.join("Cursor/User/globalStorage/anthropic.claude-mcp/mcp_servers.json");
            if cursor_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE".to_string(),
                    path: cursor_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
        }
        if let Some(home) = dirs::home_dir() {
            let cursor_alt_path = home.join(".cursor/mcp.json");
            if cursor_alt_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE (User Config)".to_string(),
                    path: cursor_alt_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(config) = dirs::config_dir() {
            let cursor_path =
                config.join("Cursor/User/globalStorage/anthropic.claude-mcp/mcp_servers.json");
            if cursor_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE".to_string(),
                    path: cursor_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
        }
        if let Some(home) = dirs::home_dir() {
            let cursor_alt_path = home.join(".cursor/mcp.json");
            if cursor_alt_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Cursor IDE (User Config)".to_string(),
                    path: cursor_alt_path.to_string_lossy().to_string(),
                    source_type: "cursor".to_string(),
                });
            }
        }
    }

    // Windsurf IDE config
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let windsurf_path = home.join(".codeium/windsurf/mcp_config.json");
            if windsurf_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Windsurf IDE".to_string(),
                    path: windsurf_path.to_string_lossy().to_string(),
                    source_type: "windsurf".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(home) = dirs::home_dir() {
            let windsurf_path = home.join(".codeium/windsurf/mcp_config.json");
            if windsurf_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Windsurf IDE".to_string(),
                    path: windsurf_path.to_string_lossy().to_string(),
                    source_type: "windsurf".to_string(),
                });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(home) = dirs::home_dir() {
            let windsurf_path = home.join(".codeium/windsurf/mcp_config.json");
            if windsurf_path.exists() {
                sources.push(MCPConfigSource {
                    name: "Windsurf IDE".to_string(),
                    path: windsurf_path.to_string_lossy().to_string(),
                    source_type: "windsurf".to_string(),
                });
            }
        }
    }

    sources
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_mcp_import_data_handles_servers_array() {
        let data = r#"{
            "version": 1,
            "servers": [
                {
                    "id": "server1",
                    "name": "Server 1",
                    "type": "stdio",
                    "enabled": false,
                    "command": "npx",
                    "args": ["-y", "test"],
                    "createdAt": 0,
                    "updatedAt": 0
                }
            ]
        }"#;

        let servers = parse_mcp_import_data(data).unwrap();

        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "Server 1");
        assert_eq!(servers[0].command, Some("npx".to_string()));
    }

    #[test]
    fn parse_mcp_import_data_handles_claude_desktop_format() {
        let data = r#"{
            "mcpServers": {
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
                },
                "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github"],
                    "env": {
                        "GITHUB_TOKEN": "test-token"
                    }
                }
            }
        }"#;

        let servers = parse_mcp_import_data(data).unwrap();

        assert_eq!(servers.len(), 2);

        let fs_server = servers.iter().find(|s| s.name == "filesystem").unwrap();
        assert_eq!(fs_server.server_type, "stdio");
        assert_eq!(fs_server.command, Some("npx".to_string()));

        let gh_server = servers.iter().find(|s| s.name == "github").unwrap();
        assert!(gh_server.env.is_some());
        assert_eq!(
            gh_server.env.as_ref().unwrap().get("GITHUB_TOKEN"),
            Some(&"test-token".to_string())
        );
    }

    #[test]
    fn convert_claude_desktop_server_infers_type() {
        let stdio_server = ClaudeDesktopMCPServer {
            command: Some("npx".to_string()),
            args: Some(vec!["-y".to_string(), "test".to_string()]),
            env: None,
            url: None,
            headers: None,
            server_type: None,
        };

        let converted = convert_claude_desktop_server("test", &stdio_server);
        assert_eq!(converted.server_type, "stdio");

        let http_server = ClaudeDesktopMCPServer {
            command: None,
            args: None,
            env: None,
            url: Some("http://localhost:3000".to_string()),
            headers: None,
            server_type: None,
        };

        let converted = convert_claude_desktop_server("http-test", &http_server);
        assert_eq!(converted.server_type, "http");
    }

    #[test]
    fn parse_mcp_import_data_assigns_ids_when_missing() {
        let data = r#"{
            "servers": [
                {
                    "id": "",
                    "name": "No ID Server",
                    "type": "stdio",
                    "enabled": false,
                    "command": "test",
                    "createdAt": 0,
                    "updatedAt": 0
                }
            ]
        }"#;

        let servers = parse_mcp_import_data(data).unwrap();

        assert_eq!(servers.len(), 1);
        assert!(!servers[0].id.is_empty());
        assert!(servers[0].id.starts_with("imported_"));
    }

    #[test]
    fn detect_external_mcp_configs_returns_valid_vector() {
        // This test just ensures the function runs without panicking
        let sources = detect_external_mcp_configs();
        // We can't assert specific results since it depends on the system
        // Just verify it returns a valid vector (empty or not)
        let _ = sources.len();
    }
}
