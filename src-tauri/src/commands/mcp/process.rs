//! MCP server process management commands

use super::types::{MCPServerConfig, MCPServerStatus, MCPState};
use crate::error::AppError;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};

/// Start an MCP server process
#[tauri::command]
pub fn start_mcp_server(
    config: MCPServerConfig,
    state: tauri::State<'_, MCPState>,
) -> Result<MCPServerStatus, AppError> {
    if config.server_type != "stdio" {
        return Err(AppError::Mcp(
            "Only stdio MCP servers can be started natively".to_string(),
        ));
    }

    let command = config
        .command
        .as_ref()
        .ok_or_else(|| AppError::Mcp("No command specified for stdio server".to_string()))?;

    let args = config.args.clone().unwrap_or_default();

    let mut cmd = Command::new(command);
    cmd.args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Set environment variables if provided
    if let Some(env_vars) = &config.env {
        for (key, value) in env_vars {
            cmd.env(key, value);
        }
    }

    let child = cmd.spawn().map_err(|e| {
        AppError::Mcp(format!("Failed to start MCP server '{}': {}", config.name, e))
    })?;

    let pid = child.id();
    let server_id = config.id.clone();

    let status = MCPServerStatus {
        id: server_id.clone(),
        status: "running".to_string(),
        pid: Some(pid),
        error: None,
        tools: Vec::new(), // Tools will be populated after initialization
    };

    let mut state_guard = state.lock().map_err(|e| AppError::Mcp(e.to_string()))?;
    state_guard.processes.insert(server_id.clone(), child);
    state_guard.statuses.insert(server_id, status.clone());

    log::info!("MCP server '{}' started with PID {}", config.name, pid);
    Ok(status)
}

/// Stop an MCP server process
#[tauri::command]
pub fn stop_mcp_server(server_id: String, state: tauri::State<'_, MCPState>) -> Result<(), AppError> {
    let mut state_guard = state.lock().map_err(|e| AppError::Mcp(e.to_string()))?;

    if let Some(mut child) = state_guard.processes.remove(&server_id) {
        child
            .kill()
            .map_err(|e| AppError::Mcp(format!("Failed to kill process: {}", e)))?;
        log::info!("MCP server '{}' stopped", server_id);
    }

    state_guard.statuses.remove(&server_id);
    Ok(())
}

/// Get status of all MCP servers
#[tauri::command]
pub fn get_mcp_server_statuses(
    state: tauri::State<'_, MCPState>,
) -> Result<Vec<MCPServerStatus>, AppError> {
    let mut state_guard = state.lock().map_err(|e| AppError::Mcp(e.to_string()))?;

    // Collect process check results first to avoid borrow conflicts
    let mut updates: Vec<(String, Option<std::process::ExitStatus>, Option<String>)> = Vec::new();

    for (id, child) in state_guard.processes.iter_mut() {
        match child.try_wait() {
            Ok(Some(exit_status)) => {
                updates.push((id.clone(), Some(exit_status), None));
            }
            Ok(None) => {
                // Process is still running, no update needed
            }
            Err(e) => {
                updates.push((id.clone(), None, Some(e.to_string())));
            }
        }
    }

    // Apply updates to statuses
    let mut to_remove = Vec::new();
    for (id, exit_status, error) in updates {
        if let Some(status) = state_guard.statuses.get_mut(&id) {
            if let Some(exit) = exit_status {
                status.status = "stopped".to_string();
                status.pid = None;
                if !exit.success() {
                    status.error = Some(format!("Process exited with: {}", exit));
                }
                to_remove.push(id);
            } else if let Some(err) = error {
                status.status = "error".to_string();
                status.error = Some(err);
            }
        }
    }

    // Remove exited processes
    for id in to_remove {
        state_guard.processes.remove(&id);
    }

    Ok(state_guard.statuses.values().cloned().collect())
}

/// Send a message to an MCP server via stdin and read response from stdout
#[tauri::command]
pub fn send_mcp_message(
    server_id: String,
    message: String,
    state: tauri::State<'_, MCPState>,
) -> Result<String, AppError> {
    let mut state_guard = state.lock().map_err(|e| AppError::Mcp(e.to_string()))?;

    let child = state_guard
        .processes
        .get_mut(&server_id)
        .ok_or_else(|| AppError::NotFound(format!("MCP server '{}' not found", server_id)))?;

    // Write message to stdin
    if let Some(stdin) = child.stdin.as_mut() {
        writeln!(stdin, "{}", message)
            .map_err(|e| AppError::Mcp(format!("Failed to write to stdin: {}", e)))?;
        stdin
            .flush()
            .map_err(|e| AppError::Mcp(format!("Failed to flush stdin: {}", e)))?;
    } else {
        return Err(AppError::Mcp("Stdin not available".to_string()));
    }

    // Read response from stdout (with timeout handling would be better in production)
    if let Some(stdout) = child.stdout.as_mut() {
        let mut reader = BufReader::new(stdout);
        let mut response = String::new();
        reader
            .read_line(&mut response)
            .map_err(|e| AppError::Mcp(format!("Failed to read from stdout: {}", e)))?;
        Ok(response.trim().to_string())
    } else {
        Err(AppError::Mcp("Stdout not available".to_string()))
    }
}
