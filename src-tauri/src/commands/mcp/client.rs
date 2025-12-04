//! MCP client implementation using official rmcp SDK
//!
//! This module provides a high-level interface for managing MCP server connections
//! using the official Rust MCP SDK (rmcp).

use crate::error::AppError;
use rmcp::{
    model::{CallToolRequestParam, GetPromptRequestParam, ReadResourceRequestParam},
    service::{RunningService, ServiceExt},
    transport::{ConfigureCommandExt, TokioChildProcess},
    RoleClient,
};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::RwLock;

// ============================================================================
// Types
// ============================================================================

/// MCP client session information
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPClientInfo {
    pub server_id: String,
    pub server_name: String,
    pub protocol_version: Option<String>,
    pub capabilities: MCPServerCapabilities,
    pub status: String,
}

/// MCP server capabilities
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPServerCapabilities {
    pub tools: bool,
    pub resources: bool,
    pub prompts: bool,
    pub logging: bool,
}

/// MCP tool information (simplified for frontend)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPToolInfo {
    pub name: String,
    pub description: Option<String>,
    pub input_schema: Option<serde_json::Value>,
}

/// MCP resource information (simplified for frontend)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPResourceInfo {
    pub uri: String,
    pub name: String,
    pub description: Option<String>,
    pub mime_type: Option<String>,
}

/// MCP prompt information (simplified for frontend)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPPromptInfo {
    pub name: String,
    pub description: Option<String>,
    pub arguments: Option<Vec<MCPPromptArgument>>,
}

/// MCP prompt argument
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPPromptArgument {
    pub name: String,
    pub description: Option<String>,
    pub required: bool,
}

/// Tool call result (simplified for frontend)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPToolCallResult {
    pub success: bool,
    pub content: Vec<MCPContent>,
    pub is_error: bool,
}

/// MCP content item
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: Option<String>,
    pub data: Option<String>,
    pub mime_type: Option<String>,
}

/// Resource read result
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPResourceReadResult {
    pub contents: Vec<MCPResourceContent>,
}

/// Resource content
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPResourceContent {
    pub uri: String,
    pub mime_type: Option<String>,
    pub text: Option<String>,
    pub blob: Option<String>,
}

/// Prompt get result
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPPromptGetResult {
    pub description: Option<String>,
    pub messages: Vec<MCPPromptMessage>,
}

/// Prompt message
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MCPPromptMessage {
    pub role: String,
    pub content: MCPContent,
}

// ============================================================================
// Client Session Management
// ============================================================================

/// Active MCP client session
pub struct MCPClientSession {
    pub server_id: String,
    pub server_name: String,
    pub service: RunningService<RoleClient, ()>,
}

/// Global state for managing MCP client sessions
pub struct MCPClientState {
    pub sessions: HashMap<String, MCPClientSession>,
}

impl Default for MCPClientState {
    fn default() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }
}

/// Thread-safe MCP client state
pub type MCPClientStateHandle = Arc<RwLock<MCPClientState>>;

/// Create a new MCP client state handle
pub fn create_mcp_client_state() -> MCPClientStateHandle {
    Arc::new(RwLock::new(MCPClientState::default()))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Extract capabilities from peer info
fn extract_capabilities(
    peer_info: Option<&rmcp::model::InitializeResult>,
) -> MCPServerCapabilities {
    match peer_info {
        Some(info) => MCPServerCapabilities {
            tools: info.capabilities.tools.is_some(),
            resources: info.capabilities.resources.is_some(),
            prompts: info.capabilities.prompts.is_some(),
            logging: info.capabilities.logging.is_some(),
        },
        None => MCPServerCapabilities::default(),
    }
}

/// Extract protocol version from peer info
fn extract_protocol_version(peer_info: Option<&rmcp::model::InitializeResult>) -> Option<String> {
    peer_info.map(|info| info.protocol_version.to_string())
}

/// Convert Annotated<RawContent> to MCPContent
fn convert_raw_content(content: rmcp::model::Annotated<rmcp::model::RawContent>) -> MCPContent {
    match &*content {
        rmcp::model::RawContent::Text(text) => MCPContent {
            content_type: "text".to_string(),
            text: Some(text.text.to_string()),
            data: None,
            mime_type: None,
        },
        rmcp::model::RawContent::Image(img) => MCPContent {
            content_type: "image".to_string(),
            text: None,
            data: Some(img.data.to_string()),
            mime_type: Some(img.mime_type.to_string()),
        },
        rmcp::model::RawContent::Audio(audio) => MCPContent {
            content_type: "audio".to_string(),
            text: None,
            data: Some(audio.data.to_string()),
            mime_type: Some(audio.mime_type.to_string()),
        },
        rmcp::model::RawContent::Resource(res) => {
            // ResourceContents is an enum with struct variants
            let (text, blob, mime_type) = match &res.resource {
                rmcp::model::ResourceContents::TextResourceContents { text, mime_type, .. } => {
                    (Some(text.to_string()), None, mime_type.clone())
                }
                rmcp::model::ResourceContents::BlobResourceContents { blob, mime_type, .. } => {
                    (None, Some(blob.to_string()), mime_type.clone())
                }
            };
            MCPContent {
                content_type: "resource".to_string(),
                text,
                data: blob,
                mime_type,
            }
        }
        rmcp::model::RawContent::ResourceLink(link) => MCPContent {
            content_type: "resource_link".to_string(),
            text: Some(link.uri.to_string()),
            data: None,
            mime_type: link.mime_type.clone(),
        },
    }
}

/// Convert PromptMessageContent to MCPContent
fn convert_prompt_content(content: rmcp::model::PromptMessageContent) -> MCPContent {
    match content {
        rmcp::model::PromptMessageContent::Text { text } => MCPContent {
            content_type: "text".to_string(),
            text: Some(text),
            data: None,
            mime_type: None,
        },
        rmcp::model::PromptMessageContent::Image { image } => MCPContent {
            content_type: "image".to_string(),
            text: None,
            data: Some(image.data.to_string()),
            mime_type: Some(image.mime_type.to_string()),
        },
        rmcp::model::PromptMessageContent::Resource { resource } => {
            // resource is Annotated<RawEmbeddedResource>, access inner resource field
            let (text, blob, mime_type) = match &resource.resource {
                rmcp::model::ResourceContents::TextResourceContents { text, mime_type, .. } => {
                    (Some(text.to_string()), None, mime_type.clone())
                }
                rmcp::model::ResourceContents::BlobResourceContents { blob, mime_type, .. } => {
                    (None, Some(blob.to_string()), mime_type.clone())
                }
            };
            MCPContent {
                content_type: "resource".to_string(),
                text,
                data: blob,
                mime_type,
            }
        }
        rmcp::model::PromptMessageContent::ResourceLink { link } => MCPContent {
            content_type: "resource_link".to_string(),
            text: Some(link.uri.to_string()),
            data: None,
            mime_type: link.mime_type.clone(),
        },
    }
}

/// Convert PromptMessageRole to string
fn role_to_string(role: rmcp::model::PromptMessageRole) -> String {
    match role {
        rmcp::model::PromptMessageRole::User => "user".to_string(),
        rmcp::model::PromptMessageRole::Assistant => "assistant".to_string(),
    }
}

// ============================================================================
// Client Operations
// ============================================================================

/// Connect to an MCP server using stdio transport
pub async fn connect_mcp_server(
    state: &MCPClientStateHandle,
    server_id: String,
    server_name: String,
    command: String,
    args: Vec<String>,
    env: Option<HashMap<String, String>>,
) -> Result<MCPClientInfo, AppError> {
    // Check if already connected
    {
        let state_guard = state.read().await;
        if state_guard.sessions.contains_key(&server_id) {
            return Err(AppError::Mcp(format!(
                "Server '{}' is already connected",
                server_id
            )));
        }
    }

    // Create the command
    let env_clone = env.clone();
    let args_clone = args.clone();

    let transport = TokioChildProcess::new(Command::new(&command).configure(move |cmd| {
        cmd.args(&args_clone);
        if let Some(ref env_vars) = env_clone {
            for (key, value) in env_vars {
                cmd.env(key, value);
            }
        }
    }))
    .map_err(|e| AppError::Mcp(format!("Failed to create transport: {}", e)))?;

    // Connect and initialize
    let service = ()
        .serve(transport)
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to connect to MCP server: {}", e)))?;

    // Get server info
    let peer_info = service.peer_info();
    let capabilities = extract_capabilities(peer_info);
    let protocol_version = extract_protocol_version(peer_info);

    let client_info = MCPClientInfo {
        server_id: server_id.clone(),
        server_name: server_name.clone(),
        protocol_version,
        capabilities,
        status: "connected".to_string(),
    };

    // Store session
    {
        let mut state_guard = state.write().await;
        state_guard.sessions.insert(
            server_id.clone(),
            MCPClientSession {
                server_id,
                server_name,
                service,
            },
        );
    }

    tracing::info!("Connected to MCP server: {}", client_info.server_name);
    Ok(client_info)
}

/// Disconnect from an MCP server
pub async fn disconnect_mcp_server(
    state: &MCPClientStateHandle,
    server_id: &str,
) -> Result<(), AppError> {
    let session = {
        let mut state_guard = state.write().await;
        state_guard.sessions.remove(server_id)
    };

    if let Some(session) = session {
        session
            .service
            .cancel()
            .await
            .map_err(|e| AppError::Mcp(format!("Failed to disconnect: {}", e)))?;
        tracing::info!("Disconnected from MCP server: {}", session.server_name);
        Ok(())
    } else {
        Err(AppError::NotFound(format!(
            "Server '{}' not found",
            server_id
        )))
    }
}

/// List tools from an MCP server
pub async fn list_mcp_tools(
    state: &MCPClientStateHandle,
    server_id: &str,
) -> Result<Vec<MCPToolInfo>, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    let result = session
        .service
        .list_tools(Default::default())
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to list tools: {}", e)))?;

    let tools = result
        .tools
        .into_iter()
        .map(|t| MCPToolInfo {
            name: t.name.to_string(),
            description: t.description.map(|s| s.to_string()),
            input_schema: serde_json::to_value(&t.input_schema).ok(),
        })
        .collect();

    Ok(tools)
}

/// List resources from an MCP server
pub async fn list_mcp_resources(
    state: &MCPClientStateHandle,
    server_id: &str,
) -> Result<Vec<MCPResourceInfo>, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    let result = session
        .service
        .list_resources(Default::default())
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to list resources: {}", e)))?;

    let resources = result
        .resources
        .into_iter()
        .map(|r| MCPResourceInfo {
            uri: r.uri.to_string(),
            name: r.name.to_string(),
            description: r.description.clone(),
            mime_type: r.mime_type.clone(),
        })
        .collect();

    Ok(resources)
}

/// List prompts from an MCP server
pub async fn list_mcp_prompts(
    state: &MCPClientStateHandle,
    server_id: &str,
) -> Result<Vec<MCPPromptInfo>, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    let result = session
        .service
        .list_prompts(Default::default())
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to list prompts: {}", e)))?;

    let prompts = result
        .prompts
        .into_iter()
        .map(|p| MCPPromptInfo {
            name: p.name.to_string(),
            description: p.description.map(|s| s.to_string()),
            arguments: p.arguments.map(|args| {
                args.into_iter()
                    .map(|a| MCPPromptArgument {
                        name: a.name.to_string(),
                        description: a.description.map(|s| s.to_string()),
                        required: a.required.unwrap_or(false),
                    })
                    .collect()
            }),
        })
        .collect();

    Ok(prompts)
}

/// Call a tool on an MCP server
pub async fn call_mcp_tool(
    state: &MCPClientStateHandle,
    server_id: &str,
    tool_name: String,
    arguments: Option<serde_json::Value>,
) -> Result<MCPToolCallResult, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    let args = arguments.and_then(|v| v.as_object().cloned());

    let result = session
        .service
        .call_tool(CallToolRequestParam {
            name: tool_name.into(),
            arguments: args,
        })
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to call tool: {}", e)))?;

    let content = result.content.into_iter().map(convert_raw_content).collect();

    Ok(MCPToolCallResult {
        success: true,
        content,
        is_error: result.is_error.unwrap_or(false),
    })
}

/// Read a resource from an MCP server
pub async fn read_mcp_resource(
    state: &MCPClientStateHandle,
    server_id: &str,
    uri: &str,
) -> Result<MCPResourceReadResult, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    let result = session
        .service
        .read_resource(ReadResourceRequestParam { uri: uri.into() })
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to read resource: {}", e)))?;

    let contents = result
        .contents
        .into_iter()
        .map(|c| {
            // ResourceContents is an enum with struct variants
            match c {
                rmcp::model::ResourceContents::TextResourceContents { uri, mime_type, text, .. } => MCPResourceContent {
                    uri,
                    mime_type,
                    text: Some(text),
                    blob: None,
                },
                rmcp::model::ResourceContents::BlobResourceContents { uri, mime_type, blob, .. } => MCPResourceContent {
                    uri,
                    mime_type,
                    text: None,
                    blob: Some(blob),
                },
            }
        })
        .collect();

    Ok(MCPResourceReadResult { contents })
}

/// Get a prompt from an MCP server
pub async fn get_mcp_prompt(
    state: &MCPClientStateHandle,
    server_id: &str,
    prompt_name: &str,
    arguments: Option<HashMap<String, String>>,
) -> Result<MCPPromptGetResult, AppError> {
    let state_guard = state.read().await;
    let session = state_guard
        .sessions
        .get(server_id)
        .ok_or_else(|| AppError::NotFound(format!("Server '{}' not found", server_id)))?;

    // Convert HashMap<String, String> to serde_json::Map<String, Value>
    let args = arguments.map(|map| {
        map.into_iter()
            .map(|(k, v)| (k, serde_json::Value::String(v)))
            .collect()
    });

    let result = session
        .service
        .get_prompt(GetPromptRequestParam {
            name: prompt_name.into(),
            arguments: args,
        })
        .await
        .map_err(|e| AppError::Mcp(format!("Failed to get prompt: {}", e)))?;

    let messages = result
        .messages
        .into_iter()
        .map(|m| MCPPromptMessage {
            role: role_to_string(m.role),
            content: convert_prompt_content(m.content),
        })
        .collect();

    Ok(MCPPromptGetResult {
        description: result.description.clone(),
        messages,
    })
}

/// Get all connected MCP clients info
pub async fn get_connected_mcp_clients(
    state: &MCPClientStateHandle,
) -> Result<Vec<MCPClientInfo>, AppError> {
    let state_guard = state.read().await;

    let mut clients = Vec::new();
    for (server_id, session) in &state_guard.sessions {
        let peer_info = session.service.peer_info();
        let capabilities = extract_capabilities(peer_info);
        let protocol_version = extract_protocol_version(peer_info);

        clients.push(MCPClientInfo {
            server_id: server_id.clone(),
            server_name: session.server_name.clone(),
            protocol_version,
            capabilities,
            status: "connected".to_string(),
        });
    }

    Ok(clients)
}

/// Disconnect all MCP servers
pub async fn disconnect_all_mcp_servers(state: &MCPClientStateHandle) -> Result<(), AppError> {
    let sessions: Vec<MCPClientSession> = {
        let mut state_guard = state.write().await;
        state_guard.sessions.drain().map(|(_, v)| v).collect()
    };

    for session in sessions {
        if let Err(e) = session.service.cancel().await {
            tracing::warn!(
                "Failed to disconnect from MCP server {}: {}",
                session.server_name,
                e
            );
        } else {
            tracing::info!("Disconnected from MCP server: {}", session.server_name);
        }
    }

    Ok(())
}
