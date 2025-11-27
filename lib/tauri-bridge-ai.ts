import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { isTauri } from "./tauri-bridge";

const MISSING_API_KEY_COMMAND = "Command get_api_key not found";
let missingCommandToastShown = false;

// ============================================================================
// Web Crypto API Encryption for Browser Mode
// ============================================================================

const ENCRYPTION_KEY_NAME = "ai_encryption_key";

/**
 * Get or create an AES-GCM encryption key for browser storage
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (stored) {
    try {
      const keyData = JSON.parse(stored);
      return await crypto.subtle.importKey(
        "jwk",
        keyData,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    } catch {
      // If key is corrupted, create a new one
      localStorage.removeItem(ENCRYPTION_KEY_NAME);
    }
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));
  return key;
}

/**
 * Encrypt an API key using AES-GCM
 */
async function encryptAPIKey(apiKey: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
    v: 1, // Version marker for future compatibility
  });
}

/**
 * Decrypt an API key using AES-GCM
 */
async function decryptAPIKey(encrypted: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const parsed = JSON.parse(encrypted);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(parsed.iv) },
    key,
    new Uint8Array(parsed.data)
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a stored value is encrypted (has the expected JSON structure)
 */
function isEncryptedValue(value: string): boolean {
  if (!value.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(value);
    return "iv" in parsed && "data" in parsed;
  } catch {
    return false;
  }
}

function isMissingAPIKeyCommand(error: unknown): boolean {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof error === "object" && "message" in (error as Record<string, unknown>)
      ? String((error as { message?: unknown }).message)
      : "";

  return message.includes(MISSING_API_KEY_COMMAND);
}

/**
 * Store and retrieve API keys securely in Tauri
 */

export interface SecureStorageItem {
  key: string;
  value: string;
}

/**
 * Save API key securely
 * In desktop mode, stores in OS keyring/credential manager
 * In browser mode, uses AES-GCM encryption before localStorage storage
 *
 * @param provider - Provider identifier (can be built-in like "openai" or custom provider ID)
 * @param apiKey - The API key to store
 */
export async function saveAPIKeySecurely(provider: string, apiKey: string): Promise<void> {
  if (!isTauri()) {
    // Browser mode: encrypt before storing in localStorage
    try {
      const encrypted = await encryptAPIKey(apiKey);
      localStorage.setItem(`ai_api_key_${provider}`, encrypted);
    } catch (error) {
      console.error("Failed to encrypt API key:", error);
      throw error;
    }
    return;
  }

  try {
    await invoke("save_api_key", {
      provider,
      apiKey,
    });
  } catch (error) {
    console.error("Failed to save API key securely:", error);
    throw error;
  }
}

/**
 * Retrieve API key securely
 * In browser mode, decrypts from localStorage (with migration for old unencrypted keys)
 *
 * @param provider - Provider identifier (can be built-in like "openai" or custom provider ID)
 */
export async function getAPIKeySecurely(provider: string): Promise<string | null> {
  if (!isTauri()) {
    // Browser mode: retrieve and decrypt from localStorage
    const stored = localStorage.getItem(`ai_api_key_${provider}`);
    if (!stored) return null;

    // Check if the value is encrypted
    if (isEncryptedValue(stored)) {
      try {
        return await decryptAPIKey(stored);
      } catch (error) {
        console.error("Failed to decrypt API key:", error);
        // If decryption fails, the key might be corrupted
        // Remove it and return null
        localStorage.removeItem(`ai_api_key_${provider}`);
        return null;
      }
    }

    // Migration: old unencrypted key found, encrypt and save it
    try {
      const encrypted = await encryptAPIKey(stored);
      localStorage.setItem(`ai_api_key_${provider}`, encrypted);
      return stored;
    } catch (error) {
      console.error("Failed to migrate unencrypted API key:", error);
      return stored; // Return the unencrypted key as fallback
    }
  }

  try {
    const apiKey = await invoke<string>("get_api_key", {
      provider,
    });
    return apiKey;
  } catch (error) {
    if (isMissingAPIKeyCommand(error)) {
      if (!missingCommandToastShown) {
        missingCommandToastShown = true;
        toast.error(
          "Secure storage service is unavailable. Please update the desktop app or re-run setup.",
          {
            description: "Command get_api_key not found",
          }
        );
      }
    }
    console.error("Failed to retrieve API key:", error);
    return null;
  }
}

/**
 * Delete API key securely
 *
 * @param provider - Provider identifier (can be built-in like "openai" or custom provider ID)
 */
export async function deleteAPIKeySecurely(provider: string): Promise<void> {
  if (!isTauri()) {
    // Browser mode: delete from localStorage
    localStorage.removeItem(`ai_api_key_${provider}`);
    return;
  }

  try {
    await invoke("delete_api_key", {
      provider,
    });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    throw error;
  }
}

/**
 * Check if API key exists
 *
 * @param provider - Provider identifier (can be built-in like "openai" or custom provider ID)
 */
export async function hasAPIKeyStored(provider: string): Promise<boolean> {
  const apiKey = await getAPIKeySecurely(provider);
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Export conversation as file (Tauri only)
 * Allows saving chat history to disk
 */
export async function exportConversation(
  conversationData: string,
  fileName: string
): Promise<void> {
  if (!isTauri()) {
    // Fallback: download via browser
    const blob = new Blob([conversationData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  try {
    await invoke("export_conversation", {
      data: conversationData,
      fileName,
    });
  } catch (error) {
    console.error("Failed to export conversation:", error);
    throw error;
  }
}

/**
 * Proxy AI request through Tauri backend (optional, for enhanced privacy)
 * This allows the Rust backend to make API calls instead of the frontend
 */
export async function proxyAIRequest(
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> {
  if (!isTauri()) {
    throw new Error("AI proxy is only available in Tauri desktop mode");
  }

  try {
    const response = await invoke<string>("proxy_ai_request", {
      provider,
      model,
      messages,
      systemPrompt,
    });
    return response;
  } catch (error) {
    console.error("AI proxy request failed:", error);
    throw error;
  }
}

/**
 * Get AI usage statistics (Tauri only, optional feature)
 * Track token usage across conversations
 */
export async function getAIUsageStats(): Promise<{
  totalTokens: number;
  totalRequests: number;
  costEstimate: number;
} | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const stats = await invoke<{
      totalTokens: number;
      totalRequests: number;
      costEstimate: number;
    }>("get_ai_usage_stats");
    return stats;
  } catch (error) {
    console.error("Failed to get AI usage stats:", error);
    return null;
  }
}

/**
 * Clear AI usage statistics
 */
export async function clearAIUsageStats(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    await invoke("clear_ai_usage_stats");
  } catch (error) {
    console.error("Failed to clear AI usage stats:", error);
    throw error;
  }
}

/**
 * Check if Tauri AI features are available
 */
export function isTauriAIAvailable(): boolean {
  return isTauri();
}

/**
 * Get recommended storage location for API keys
 */
export function getStorageRecommendation(): {
  mode: "tauri" | "browser";
  secure: boolean;
  description: string;
} {
  if (isTauri()) {
    return {
      mode: "tauri",
      secure: true,
      description: "API keys are stored securely in your system's credential manager",
    };
  }

  return {
    mode: "browser",
    secure: false,
    description: "API keys are stored in browser localStorage (less secure). Consider using desktop app for better security.",
  };
}
