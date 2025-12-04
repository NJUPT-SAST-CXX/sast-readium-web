//! Tauri command modules

pub mod system;
pub mod file_ops;
pub mod ai_keys;
pub mod ai_usage;
pub mod ai_proxy;
pub mod mcp;

// Re-export all commands for easy registration
pub use system::*;
pub use file_ops::*;
pub use ai_keys::*;
pub use ai_usage::*;
pub use ai_proxy::*;
pub use mcp::*;
