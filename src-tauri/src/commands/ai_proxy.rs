//! AI proxy request command

use crate::commands::ai_keys::KEYRING_SERVICE;
use crate::error::AppError;
use serde::{Deserialize, Serialize};

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
}

#[derive(Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Deserialize)]
struct OpenAIChoice {
    message: OpenAIResponseMessage,
}

#[derive(Deserialize)]
struct OpenAIResponseMessage {
    content: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Get the API endpoint for a provider
pub fn get_provider_endpoint(provider: &str) -> &'static str {
    match provider {
        "openai" => "https://api.openai.com/v1/chat/completions",
        "anthropic" => "https://api.anthropic.com/v1/messages",
        "deepseek" => "https://api.deepseek.com/v1/chat/completions",
        "groq" => "https://api.groq.com/openai/v1/chat/completions",
        "openrouter" => "https://openrouter.ai/api/v1/chat/completions",
        _ => "https://api.openai.com/v1/chat/completions", // Default to OpenAI-compatible
    }
}

// ============================================================================
// Commands
// ============================================================================

/// Proxy AI request through the Rust backend
#[tauri::command]
pub async fn proxy_ai_request(
    provider: String,
    model: String,
    messages: Vec<AIMessage>,
    system_prompt: Option<String>,
) -> Result<String, AppError> {
    // Get API key from secure storage
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| AppError::Keyring(e.to_string()))?;
    let api_key = entry
        .get_password()
        .map_err(|e| AppError::Keyring(format!("No API key found for {}: {}", provider, e)))?;

    let endpoint = get_provider_endpoint(&provider);

    // Build messages array
    let mut openai_messages: Vec<OpenAIMessage> = Vec::new();

    // Add system prompt if provided
    if let Some(system) = system_prompt {
        openai_messages.push(OpenAIMessage {
            role: "system".to_string(),
            content: system,
        });
    }

    // Add conversation messages
    for msg in messages {
        openai_messages.push(OpenAIMessage {
            role: msg.role,
            content: msg.content,
        });
    }

    let request_body = OpenAIRequest {
        model,
        messages: openai_messages,
        max_tokens: Some(4096),
        temperature: Some(0.7),
    };

    // Make HTTP request
    let client = reqwest::Client::new();
    let response = client
        .post(endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| AppError::Http(e.to_string()))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(AppError::Http(format!(
            "API request failed with status {}: {}",
            status, error_text
        )));
    }

    let response_body: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| AppError::Http(format!("Failed to parse response: {}", e)))?;

    let content = response_body
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    Ok(content)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_provider_endpoint_covers_known_providers() {
        assert_eq!(
            get_provider_endpoint("openai"),
            "https://api.openai.com/v1/chat/completions"
        );
        assert_eq!(
            get_provider_endpoint("anthropic"),
            "https://api.anthropic.com/v1/messages"
        );
        assert_eq!(
            get_provider_endpoint("unknown"),
            "https://api.openai.com/v1/chat/completions"
        );
    }
}
