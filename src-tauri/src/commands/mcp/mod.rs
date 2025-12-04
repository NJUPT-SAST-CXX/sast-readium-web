//! MCP (Model Context Protocol) server management commands
//!
//! This module provides comprehensive MCP support including:
//! - Server configuration management (CRUD, import/export)
//! - Native MCP client using official rmcp SDK
//! - Process management for legacy compatibility

mod types;
mod process;
mod storage;
mod import_export;
mod presets;
mod client;
pub mod commands;

// Re-export all public items
pub use types::*;
pub use process::*;
pub use storage::*;
pub use import_export::*;
pub use presets::*;

// Re-export client types and state
pub use client::{
    create_mcp_client_state, MCPClientInfo, MCPClientStateHandle, MCPContent,
    MCPPromptGetResult, MCPPromptInfo, MCPResourceInfo, MCPResourceReadResult,
    MCPToolCallResult, MCPToolInfo,
};

// Re-export Tauri commands for MCP client
pub use commands::{
    mcp_call_tool, mcp_connect, mcp_connect_from_config, mcp_disconnect, mcp_disconnect_all,
    mcp_get_connected_clients, mcp_get_prompt, mcp_list_prompts, mcp_list_resources,
    mcp_list_tools, mcp_read_resource,
};
