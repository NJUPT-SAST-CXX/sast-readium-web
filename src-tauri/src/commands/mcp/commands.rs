//! Tauri commands for MCP client operations
//!
//! These commands expose the MCP client functionality to the frontend.

use super::client::{
    call_mcp_tool, connect_mcp_server, disconnect_all_mcp_servers, disconnect_mcp_server,
    get_connected_mcp_clients, get_mcp_prompt, list_mcp_prompts, list_mcp_resources,
    list_mcp_tools, read_mcp_resource, MCPClientInfo, MCPClientStateHandle,
    MCPPromptGetResult, MCPPromptInfo, MCPResourceInfo, MCPResourceReadResult, MCPToolCallResult,
    MCPToolInfo,
};
use super::types::MCPServerConfig;
use crate::error::AppError;
use serde::Deserialize;
use std::collections::HashMap;

// ============================================================================
// Command Parameter Types
// ============================================================================

/// Parameters for connecting to an MCP server
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectMCPServerParams {
    pub server_id: String,
    pub server_name: String,
    pub command: String,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
}

/// Parameters for calling a tool
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CallToolParams {
    pub server_id: String,
    pub tool_name: String,
    pub arguments: Option<serde_json::Value>,
}

/// Parameters for reading a resource
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadResourceParams {
    pub server_id: String,
    pub uri: String,
}

/// Parameters for getting a prompt
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetPromptParams {
    pub server_id: String,
    pub prompt_name: String,
    pub arguments: Option<HashMap<String, String>>,
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Connect to an MCP server using the official SDK
#[tauri::command]
pub async fn mcp_connect(
    state: tauri::State<'_, MCPClientStateHandle>,
    params: ConnectMCPServerParams,
) -> Result<MCPClientInfo, AppError> {
    connect_mcp_server(
        &state,
        params.server_id,
        params.server_name,
        params.command,
        params.args.unwrap_or_default(),
        params.env,
    )
    .await
}

/// Connect to an MCP server using a saved configuration
#[tauri::command]
pub async fn mcp_connect_from_config(
    state: tauri::State<'_, MCPClientStateHandle>,
    config: MCPServerConfig,
) -> Result<MCPClientInfo, AppError> {
    if config.server_type != "stdio" {
        return Err(AppError::Mcp(
            "Only stdio MCP servers are supported for native connections".to_string(),
        ));
    }

    let command = config
        .command
        .ok_or_else(|| AppError::Mcp("No command specified for stdio server".to_string()))?;

    connect_mcp_server(
        &state,
        config.id,
        config.name,
        command,
        config.args.unwrap_or_default(),
        config.env,
    )
    .await
}

/// Disconnect from an MCP server
#[tauri::command]
pub async fn mcp_disconnect(
    state: tauri::State<'_, MCPClientStateHandle>,
    server_id: String,
) -> Result<(), AppError> {
    disconnect_mcp_server(&state, &server_id).await
}

/// Disconnect from all MCP servers
#[tauri::command]
pub async fn mcp_disconnect_all(
    state: tauri::State<'_, MCPClientStateHandle>,
) -> Result<(), AppError> {
    disconnect_all_mcp_servers(&state).await
}

/// Get all connected MCP clients
#[tauri::command]
pub async fn mcp_get_connected_clients(
    state: tauri::State<'_, MCPClientStateHandle>,
) -> Result<Vec<MCPClientInfo>, AppError> {
    get_connected_mcp_clients(&state).await
}

/// List tools from an MCP server
#[tauri::command]
pub async fn mcp_list_tools(
    state: tauri::State<'_, MCPClientStateHandle>,
    server_id: String,
) -> Result<Vec<MCPToolInfo>, AppError> {
    list_mcp_tools(&state, &server_id).await
}

/// List resources from an MCP server
#[tauri::command]
pub async fn mcp_list_resources(
    state: tauri::State<'_, MCPClientStateHandle>,
    server_id: String,
) -> Result<Vec<MCPResourceInfo>, AppError> {
    list_mcp_resources(&state, &server_id).await
}

/// List prompts from an MCP server
#[tauri::command]
pub async fn mcp_list_prompts(
    state: tauri::State<'_, MCPClientStateHandle>,
    server_id: String,
) -> Result<Vec<MCPPromptInfo>, AppError> {
    list_mcp_prompts(&state, &server_id).await
}

/// Call a tool on an MCP server
#[tauri::command]
pub async fn mcp_call_tool(
    state: tauri::State<'_, MCPClientStateHandle>,
    params: CallToolParams,
) -> Result<MCPToolCallResult, AppError> {
    call_mcp_tool(&state, &params.server_id, params.tool_name, params.arguments).await
}

/// Read a resource from an MCP server
#[tauri::command]
pub async fn mcp_read_resource(
    state: tauri::State<'_, MCPClientStateHandle>,
    params: ReadResourceParams,
) -> Result<MCPResourceReadResult, AppError> {
    read_mcp_resource(&state, &params.server_id, &params.uri).await
}

/// Get a prompt from an MCP server
#[tauri::command]
pub async fn mcp_get_prompt(
    state: tauri::State<'_, MCPClientStateHandle>,
    params: GetPromptParams,
) -> Result<MCPPromptGetResult, AppError> {
    get_mcp_prompt(
        &state,
        &params.server_id,
        &params.prompt_name,
        params.arguments,
    )
    .await
}
