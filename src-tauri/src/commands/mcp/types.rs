//! MCP type definitions

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Child;
use std::sync::{Arc, Mutex};

// ============================================================================
// Core Types
// ============================================================================

/// MCP server configuration
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MCPServerConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub server_type: String, // "stdio" | "http" | "sse"
    pub enabled: bool,
    // Stdio configuration
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    // HTTP/SSE configuration
    pub url: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    // Metadata
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// MCP server runtime status
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MCPServerStatus {
    pub id: String,
    pub status: String, // "running" | "stopped" | "error"
    pub pid: Option<u32>,
    pub error: Option<String>,
    pub tools: Vec<String>,
}

/// Stored MCP servers collection with metadata
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MCPServersStore {
    pub version: u32,
    pub servers: Vec<MCPServerConfig>,
    pub updated_at: i64,
}

// ============================================================================
// Import/Export Types
// ============================================================================

/// Import payload format (compatible with external tools)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPImportPayload {
    /// Version of the import format
    pub version: Option<u32>,
    /// Source application identifier (e.g., "claude-desktop", "vscode", "cursor")
    pub source: Option<String>,
    /// Servers to import
    pub servers: Option<Vec<MCPServerConfig>>,
    /// Alternative: mcpServers object format (Claude Desktop style)
    #[serde(rename = "mcpServers")]
    pub mcp_servers: Option<HashMap<String, ClaudeDesktopMCPServer>>,
}

/// Claude Desktop MCP server format
#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeDesktopMCPServer {
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    // HTTP/SSE fields (for compatibility)
    pub url: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    #[serde(rename = "type")]
    pub server_type: Option<String>,
}

/// Import result
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPImportResult {
    pub success: bool,
    pub imported_count: usize,
    pub skipped_count: usize,
    pub errors: Vec<String>,
    pub servers: Vec<MCPServerConfig>,
}

/// Export result
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPExportResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub server_count: usize,
    pub error: Option<String>,
}

/// External MCP config source info
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPConfigSource {
    pub name: String,
    pub path: String,
    pub source_type: String,
}

// ============================================================================
// State Types
// ============================================================================

/// Global state for managing MCP server processes
pub struct MCPServerState {
    pub processes: HashMap<String, Child>,
    pub statuses: HashMap<String, MCPServerStatus>,
}

impl Default for MCPServerState {
    fn default() -> Self {
        Self {
            processes: HashMap::new(),
            statuses: HashMap::new(),
        }
    }
}

/// Thread-safe MCP state type
pub type MCPState = Arc<Mutex<MCPServerState>>;
