//! AI usage statistics commands

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AIUsageStats {
    pub total_tokens: u64,
    pub total_requests: u64,
    pub cost_estimate: f64,
    // Detailed breakdown
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cached_tokens: u64,
    // Per-provider stats
    pub provider_stats: HashMap<String, ProviderUsageStats>,
    // Timestamps
    pub first_request_at: Option<i64>,
    pub last_request_at: Option<i64>,
}

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProviderUsageStats {
    pub total_tokens: u64,
    pub total_requests: u64,
    pub cost_estimate: f64,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_usage_stats_path(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::NotFound(e.to_string()))?;
    fs::create_dir_all(&data_dir)?;
    Ok(data_dir.join("ai_usage_stats.json"))
}

pub fn load_usage_stats_from_file(path: &Path) -> Result<AIUsageStats, AppError> {
    if !path.exists() {
        return Ok(AIUsageStats::default());
    }
    let content = fs::read_to_string(path)?;
    let stats: AIUsageStats = serde_json::from_str(&content)?;
    Ok(stats)
}

pub fn save_usage_stats_to_file(path: &Path, stats: &AIUsageStats) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(stats)?;
    fs::write(path, content)?;
    Ok(())
}

fn load_usage_stats(app: &tauri::AppHandle) -> Result<AIUsageStats, AppError> {
    let path = get_usage_stats_path(app)?;
    load_usage_stats_from_file(&path)
}

fn save_usage_stats(app: &tauri::AppHandle, stats: &AIUsageStats) -> Result<(), AppError> {
    let path = get_usage_stats_path(app)?;
    save_usage_stats_to_file(&path, stats)
}

pub fn apply_usage_update(
    stats: &mut AIUsageStats,
    provider: &str,
    input_tokens: u64,
    output_tokens: u64,
    cached_tokens: Option<u64>,
    cost: Option<f64>,
    timestamp: i64,
) {
    let total_new_tokens = input_tokens + output_tokens;
    stats.total_tokens += total_new_tokens;
    stats.total_requests += 1;
    stats.input_tokens += input_tokens;
    stats.output_tokens += output_tokens;
    stats.cached_tokens += cached_tokens.unwrap_or(0);
    stats.cost_estimate += cost.unwrap_or(0.0);

    if stats.first_request_at.is_none() {
        stats.first_request_at = Some(timestamp);
    }
    stats.last_request_at = Some(timestamp);

    let provider_stats = stats
        .provider_stats
        .entry(provider.to_string())
        .or_default();
    provider_stats.total_tokens += total_new_tokens;
    provider_stats.total_requests += 1;
    provider_stats.cost_estimate += cost.unwrap_or(0.0);
}

// ============================================================================
// Commands
// ============================================================================

/// Get AI usage statistics
#[tauri::command]
pub fn get_ai_usage_stats(app: tauri::AppHandle) -> Result<AIUsageStats, AppError> {
    load_usage_stats(&app)
}

/// Clear AI usage statistics
#[tauri::command]
pub fn clear_ai_usage_stats(app: tauri::AppHandle) -> Result<(), AppError> {
    let stats = AIUsageStats::default();
    save_usage_stats(&app, &stats)?;
    log::info!("AI usage stats cleared");
    Ok(())
}

/// Update AI usage statistics (called after each AI request)
#[tauri::command]
pub fn update_ai_usage_stats(
    app: tauri::AppHandle,
    provider: String,
    input_tokens: u64,
    output_tokens: u64,
    cached_tokens: Option<u64>,
    cost: Option<f64>,
) -> Result<(), AppError> {
    let mut stats = load_usage_stats(&app)?;
    let now = chrono::Utc::now().timestamp();
    apply_usage_update(
        &mut stats,
        &provider,
        input_tokens,
        output_tokens,
        cached_tokens,
        cost,
        now,
    );
    save_usage_stats(&app, &stats)?;
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
    fn apply_usage_update_updates_totals_and_provider_stats() {
        let mut stats = AIUsageStats::default();
        apply_usage_update(&mut stats, "openai", 100, 50, Some(10), Some(0.25), 12345);

        assert_eq!(stats.total_tokens, 150);
        assert_eq!(stats.total_requests, 1);
        assert_eq!(stats.input_tokens, 100);
        assert_eq!(stats.output_tokens, 50);
        assert_eq!(stats.cached_tokens, 10);
        assert_eq!(stats.cost_estimate, 0.25);
        assert_eq!(stats.first_request_at, Some(12345));
        assert_eq!(stats.last_request_at, Some(12345));

        let provider_stats = stats.provider_stats.get("openai").unwrap();
        assert_eq!(provider_stats.total_tokens, 150);
        assert_eq!(provider_stats.total_requests, 1);
        assert_eq!(provider_stats.cost_estimate, 0.25);
    }

    #[test]
    fn save_and_load_usage_stats_round_trip() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("stats.json");
        let mut stats = AIUsageStats {
            total_requests: 3,
            ..Default::default()
        };
        stats.provider_stats.insert(
            "openai".to_string(),
            ProviderUsageStats {
                total_tokens: 200,
                total_requests: 2,
                cost_estimate: 0.5,
            },
        );

        save_usage_stats_to_file(&path, &stats).unwrap();
        let loaded = load_usage_stats_from_file(&path).unwrap();

        assert_eq!(loaded.total_requests, 3);
        assert_eq!(
            loaded.provider_stats.get("openai").unwrap().total_tokens,
            200
        );
    }

    #[test]
    fn load_usage_stats_defaults_when_missing() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("missing.json");
        let stats = load_usage_stats_from_file(&path).unwrap();
        assert_eq!(stats.total_requests, 0);
    }

    #[test]
    fn save_usage_stats_creates_parent_dirs() {
        let dir = tempdir().unwrap();
        let nested = dir.path().join("nested/stats.json");
        let stats = AIUsageStats {
            total_tokens: 42,
            ..Default::default()
        };

        save_usage_stats_to_file(&nested, &stats).unwrap();

        assert!(nested.exists());
        let loaded = load_usage_stats_from_file(&nested).unwrap();
        assert_eq!(loaded.total_tokens, 42);
    }
}
