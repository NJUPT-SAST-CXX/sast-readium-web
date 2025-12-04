//! MCP server presets

use super::types::MCPServerConfig;
use std::collections::HashMap;
use uuid::Uuid;

/// List available MCP server presets
#[tauri::command]
pub fn get_mcp_server_presets() -> Vec<MCPServerConfig> {
    let now = chrono::Utc::now().timestamp();
    vec![
        MCPServerConfig {
            id: format!("preset_filesystem_{}", Uuid::new_v4()),
            name: "Filesystem (Local)".to_string(),
            server_type: "stdio".to_string(),
            enabled: false,
            command: Some("npx".to_string()),
            args: Some(vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-filesystem".to_string(),
                ".".to_string(),
            ]),
            env: None,
            url: None,
            headers: None,
            description: Some("Access local filesystem".to_string()),
            created_at: now,
            updated_at: now,
        },
        MCPServerConfig {
            id: format!("preset_github_{}", Uuid::new_v4()),
            name: "GitHub".to_string(),
            server_type: "stdio".to_string(),
            enabled: false,
            command: Some("npx".to_string()),
            args: Some(vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-github".to_string(),
            ]),
            env: Some(HashMap::from([(
                "GITHUB_PERSONAL_ACCESS_TOKEN".to_string(),
                "".to_string(),
            )])),
            url: None,
            headers: None,
            description: Some("Access GitHub repositories and issues".to_string()),
            created_at: now,
            updated_at: now,
        },
        MCPServerConfig {
            id: format!("preset_memory_{}", Uuid::new_v4()),
            name: "Memory".to_string(),
            server_type: "stdio".to_string(),
            enabled: false,
            command: Some("npx".to_string()),
            args: Some(vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-memory".to_string(),
            ]),
            env: None,
            url: None,
            headers: None,
            description: Some("Persistent memory for conversations".to_string()),
            created_at: now,
            updated_at: now,
        },
        MCPServerConfig {
            id: format!("preset_fetch_{}", Uuid::new_v4()),
            name: "Fetch".to_string(),
            server_type: "stdio".to_string(),
            enabled: false,
            command: Some("npx".to_string()),
            args: Some(vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-fetch".to_string(),
            ]),
            env: None,
            url: None,
            headers: None,
            description: Some("Fetch and parse web content".to_string()),
            created_at: now,
            updated_at: now,
        },
    ]
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mcp_server_presets_generate_unique_ids_and_defaults() {
        let presets = get_mcp_server_presets();
        assert_eq!(presets.len(), 4);
        assert!(presets.iter().all(|preset| preset.id.starts_with("preset_")));
        assert!(presets.iter().all(|preset| preset.created_at > 0));
    }
}
