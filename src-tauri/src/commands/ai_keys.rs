//! AI API key secure storage commands

use crate::error::AppError;

/// Keyring service name for secure storage
pub const KEYRING_SERVICE: &str = "sast-readium";

/// Save an API key securely using OS credential manager
#[tauri::command]
pub fn save_api_key(provider: String, api_key: String) -> Result<(), AppError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| AppError::Keyring(e.to_string()))?;
    entry
        .set_password(&api_key)
        .map_err(|e| AppError::Keyring(e.to_string()))?;
    log::info!("API key saved for provider: {}", provider);
    Ok(())
}

/// Get an API key from OS credential manager
#[tauri::command]
pub fn get_api_key(provider: String) -> Result<Option<String>, AppError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| AppError::Keyring(e.to_string()))?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Keyring(e.to_string())),
    }
}

/// Delete an API key from OS credential manager
#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), AppError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| AppError::Keyring(e.to_string()))?;
    match entry.delete_credential() {
        Ok(_) => {
            log::info!("API key deleted for provider: {}", provider);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(AppError::Keyring(e.to_string())),
    }
}
