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
        : typeof error === "object" &&
            "message" in (error as Record<string, unknown>)
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
export async function saveAPIKeySecurely(
  provider: string,
  apiKey: string
): Promise<void> {
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
export async function getAPIKeySecurely(
  provider: string
): Promise<string | null> {
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
 * AI usage statistics interface
 */
export interface AIUsageStats {
  totalTokens: number;
  totalRequests: number;
  costEstimate: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  providerStats: Record<
    string,
    {
      totalTokens: number;
      totalRequests: number;
      costEstimate: number;
    }
  >;
  firstRequestAt: number | null;
  lastRequestAt: number | null;
}

/**
 * Get AI usage statistics (Tauri only, optional feature)
 * Track token usage across conversations
 */
export async function getAIUsageStats(): Promise<AIUsageStats | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const stats = await invoke<AIUsageStats>("get_ai_usage_stats");
    return stats;
  } catch (error) {
    console.error("Failed to get AI usage stats:", error);
    return null;
  }
}

/**
 * Update AI usage statistics after a request
 */
export async function updateAIUsageStats(
  provider: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens?: number,
  cost?: number
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    await invoke("update_ai_usage_stats", {
      provider,
      inputTokens,
      outputTokens,
      cachedTokens: cachedTokens ?? null,
      cost: cost ?? null,
    });
  } catch (error) {
    console.error("Failed to update AI usage stats:", error);
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
      description:
        "API keys are stored securely in your system's credential manager",
    };
  }

  return {
    mode: "browser",
    secure: false,
    description:
      "API keys are stored in browser localStorage (less secure). Consider using desktop app for better security.",
  };
}

// ============================================================================
// MCP Server Management (Tauri Desktop Only)
// ============================================================================

/**
 * MCP Server configuration interface (matches Rust struct)
 */
export interface TauriMCPServerConfig {
  id: string;
  name: string;
  type: "stdio" | "http" | "sse";
  enabled: boolean;
  // Stdio configuration
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // HTTP/SSE configuration
  url?: string;
  headers?: Record<string, string>;
  // Metadata
  description?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * MCP Server status interface
 */
export interface MCPServerStatus {
  id: string;
  status: "running" | "stopped" | "error";
  pid?: number;
  error?: string;
  tools: string[];
}

/**
 * Start an MCP server process (Tauri desktop only)
 * Only stdio-type servers can be started natively
 */
export async function startMCPServer(
  config: TauriMCPServerConfig
): Promise<MCPServerStatus> {
  if (!isTauri()) {
    throw new Error(
      "MCP server management is only available in Tauri desktop mode"
    );
  }

  try {
    const status = await invoke<MCPServerStatus>("start_mcp_server", {
      config,
    });
    return status;
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    throw error;
  }
}

/**
 * Stop an MCP server process
 */
export async function stopMCPServer(serverId: string): Promise<void> {
  if (!isTauri()) {
    throw new Error(
      "MCP server management is only available in Tauri desktop mode"
    );
  }

  try {
    await invoke("stop_mcp_server", { serverId });
  } catch (error) {
    console.error("Failed to stop MCP server:", error);
    throw error;
  }
}

/**
 * Get status of all running MCP servers
 */
export async function getMCPServerStatuses(): Promise<MCPServerStatus[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const statuses = await invoke<MCPServerStatus[]>("get_mcp_server_statuses");
    return statuses;
  } catch (error) {
    console.error("Failed to get MCP server statuses:", error);
    return [];
  }
}

/**
 * Send a JSON-RPC message to an MCP server and get response
 */
export async function sendMCPMessage(
  serverId: string,
  message: string
): Promise<string> {
  if (!isTauri()) {
    throw new Error(
      "MCP server communication is only available in Tauri desktop mode"
    );
  }

  try {
    const response = await invoke<string>("send_mcp_message", {
      serverId,
      message,
    });
    return response;
  } catch (error) {
    console.error("Failed to send MCP message:", error);
    throw error;
  }
}

/**
 * Get available MCP server presets
 */
export async function getMCPServerPresets(): Promise<TauriMCPServerConfig[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const presets = await invoke<TauriMCPServerConfig[]>(
      "get_mcp_server_presets"
    );
    return presets;
  } catch (error) {
    console.error("Failed to get MCP server presets:", error);
    return [];
  }
}

/**
 * Check if native MCP server management is available
 */
export function isNativeMCPAvailable(): boolean {
  return isTauri();
}

// ============================================================================
// MCP Configuration Import/Export
// ============================================================================

/**
 * MCP import result interface
 */
export interface MCPImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  servers: TauriMCPServerConfig[];
}

/**
 * MCP export result interface
 */
export interface MCPExportResult {
  success: boolean;
  filePath?: string;
  serverCount: number;
  error?: string;
}

/**
 * External MCP config source info
 */
export interface MCPConfigSource {
  name: string;
  path: string;
  sourceType: string;
}

/**
 * Get saved MCP servers from persistent storage
 */
export async function getSavedMCPServers(): Promise<TauriMCPServerConfig[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const servers = await invoke<TauriMCPServerConfig[]>(
      "get_saved_mcp_servers"
    );
    return servers;
  } catch (error) {
    console.error("Failed to get saved MCP servers:", error);
    return [];
  }
}

/**
 * Save MCP servers to persistent storage (replace all)
 */
export async function saveMCPServers(
  servers: TauriMCPServerConfig[]
): Promise<void> {
  if (!isTauri()) {
    throw new Error(
      "MCP server persistence is only available in Tauri desktop mode"
    );
  }

  try {
    await invoke("save_mcp_servers", { servers });
  } catch (error) {
    console.error("Failed to save MCP servers:", error);
    throw error;
  }
}

/**
 * Add a single MCP server to persistent storage
 */
export async function addMCPServerToStorage(
  server: TauriMCPServerConfig
): Promise<TauriMCPServerConfig> {
  if (!isTauri()) {
    throw new Error(
      "MCP server persistence is only available in Tauri desktop mode"
    );
  }

  try {
    const result = await invoke<TauriMCPServerConfig>("add_mcp_server", {
      server,
    });
    return result;
  } catch (error) {
    console.error("Failed to add MCP server:", error);
    throw error;
  }
}

/**
 * Update an existing MCP server in persistent storage
 */
export async function updateMCPServerInStorage(
  server: TauriMCPServerConfig
): Promise<TauriMCPServerConfig> {
  if (!isTauri()) {
    throw new Error(
      "MCP server persistence is only available in Tauri desktop mode"
    );
  }

  try {
    const result = await invoke<TauriMCPServerConfig>("update_mcp_server", {
      server,
    });
    return result;
  } catch (error) {
    console.error("Failed to update MCP server:", error);
    throw error;
  }
}

/**
 * Delete an MCP server from persistent storage
 */
export async function deleteMCPServerFromStorage(
  serverId: string
): Promise<void> {
  if (!isTauri()) {
    throw new Error(
      "MCP server persistence is only available in Tauri desktop mode"
    );
  }

  try {
    await invoke("delete_mcp_server", { serverId });
  } catch (error) {
    console.error("Failed to delete MCP server:", error);
    throw error;
  }
}

/**
 * Import MCP servers from JSON data
 * @param data JSON string containing MCP server configurations
 * @param merge If true, merge with existing servers; if false, replace all
 */
export async function importMCPServers(
  data: string,
  merge: boolean = true
): Promise<MCPImportResult> {
  if (!isTauri()) {
    throw new Error(
      "MCP server import is only available in Tauri desktop mode"
    );
  }

  try {
    const result = await invoke<MCPImportResult>("import_mcp_servers", {
      data,
      merge,
    });
    return result;
  } catch (error) {
    console.error("Failed to import MCP servers:", error);
    throw error;
  }
}

/**
 * Import MCP servers from a file path
 * @param filePath Path to the JSON configuration file
 * @param merge If true, merge with existing servers; if false, replace all
 */
export async function importMCPServersFromFile(
  filePath: string,
  merge: boolean = true
): Promise<MCPImportResult> {
  if (!isTauri()) {
    throw new Error(
      "MCP server import is only available in Tauri desktop mode"
    );
  }

  try {
    const result = await invoke<MCPImportResult>(
      "import_mcp_servers_from_file",
      { filePath, merge }
    );
    return result;
  } catch (error) {
    console.error("Failed to import MCP servers from file:", error);
    throw error;
  }
}

/**
 * Export MCP servers to JSON string
 */
export async function exportMCPServers(): Promise<string> {
  if (!isTauri()) {
    throw new Error(
      "MCP server export is only available in Tauri desktop mode"
    );
  }

  try {
    const data = await invoke<string>("export_mcp_servers");
    return data;
  } catch (error) {
    console.error("Failed to export MCP servers:", error);
    throw error;
  }
}

/**
 * Export MCP servers to a file
 */
export async function exportMCPServersToFile(
  filePath: string
): Promise<MCPExportResult> {
  if (!isTauri()) {
    throw new Error(
      "MCP server export is only available in Tauri desktop mode"
    );
  }

  try {
    const result = await invoke<MCPExportResult>("export_mcp_servers_to_file", {
      filePath,
    });
    return result;
  } catch (error) {
    console.error("Failed to export MCP servers to file:", error);
    throw error;
  }
}

/**
 * Export MCP servers in Claude Desktop format
 * This format is compatible with Claude Desktop, Cursor, and other tools
 */
export async function exportMCPServersClaudeFormat(): Promise<string> {
  if (!isTauri()) {
    throw new Error(
      "MCP server export is only available in Tauri desktop mode"
    );
  }

  try {
    const data = await invoke<string>("export_mcp_servers_claude_format");
    return data;
  } catch (error) {
    console.error("Failed to export MCP servers in Claude format:", error);
    throw error;
  }
}

/**
 * Detect available MCP configuration files from other IDEs/tools
 * Returns a list of detected config sources (Claude Desktop, VS Code, Cursor, Windsurf, etc.)
 */
export async function detectExternalMCPConfigs(): Promise<MCPConfigSource[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const sources = await invoke<MCPConfigSource[]>(
      "detect_external_mcp_configs"
    );
    return sources;
  } catch (error) {
    console.error("Failed to detect external MCP configs:", error);
    return [];
  }
}

// ============================================================================
// MCP Client SDK Commands (Official rmcp SDK)
// ============================================================================

/**
 * MCP server capabilities
 */
export interface MCPServerCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  logging: boolean;
}

/**
 * MCP client connection info
 */
export interface MCPClientInfo {
  serverId: string;
  serverName: string;
  protocolVersion: string | null;
  capabilities: MCPServerCapabilities;
  status: string;
}

/**
 * MCP tool information
 */
export interface MCPToolInfo {
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
}

/**
 * MCP resource information
 */
export interface MCPResourceInfo {
  uri: string;
  name: string;
  description: string | null;
  mimeType: string | null;
}

/**
 * MCP prompt information
 */
export interface MCPPromptInfo {
  name: string;
  description: string | null;
  arguments: MCPPromptArgument[] | null;
}

/**
 * MCP prompt argument
 */
export interface MCPPromptArgument {
  name: string;
  description: string | null;
  required: boolean;
}

/**
 * MCP content item
 */
export interface MCPContent {
  type: string;
  text: string | null;
  data: string | null;
  mimeType: string | null;
}

/**
 * MCP tool call result
 */
export interface MCPToolCallResult {
  success: boolean;
  content: MCPContent[];
  isError: boolean;
}

/**
 * MCP resource content
 */
export interface MCPResourceContent {
  uri: string;
  mimeType: string | null;
  text: string | null;
  blob: string | null;
}

/**
 * MCP resource read result
 */
export interface MCPResourceReadResult {
  contents: MCPResourceContent[];
}

/**
 * MCP prompt message
 */
export interface MCPPromptMessage {
  role: string;
  content: MCPContent;
}

/**
 * MCP prompt get result
 */
export interface MCPPromptGetResult {
  description: string | null;
  messages: MCPPromptMessage[];
}

/**
 * Connect to an MCP server using the official SDK
 */
export async function mcpConnect(params: {
  serverId: string;
  serverName: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}): Promise<MCPClientInfo> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const result = await invoke<MCPClientInfo>("mcp_connect", { params });
    return result;
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
    throw error;
  }
}

/**
 * Connect to an MCP server using a saved configuration
 */
export async function mcpConnectFromConfig(
  config: TauriMCPServerConfig
): Promise<MCPClientInfo> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const result = await invoke<MCPClientInfo>("mcp_connect_from_config", {
      config,
    });
    return result;
  } catch (error) {
    console.error("Failed to connect to MCP server from config:", error);
    throw error;
  }
}

/**
 * Disconnect from an MCP server
 */
export async function mcpDisconnect(serverId: string): Promise<void> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    await invoke("mcp_disconnect", { serverId });
  } catch (error) {
    console.error("Failed to disconnect from MCP server:", error);
    throw error;
  }
}

/**
 * Disconnect from all MCP servers
 */
export async function mcpDisconnectAll(): Promise<void> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    await invoke("mcp_disconnect_all");
  } catch (error) {
    console.error("Failed to disconnect from all MCP servers:", error);
    throw error;
  }
}

/**
 * Get all connected MCP clients
 */
export async function mcpGetConnectedClients(): Promise<MCPClientInfo[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const clients = await invoke<MCPClientInfo[]>("mcp_get_connected_clients");
    return clients;
  } catch (error) {
    console.error("Failed to get connected MCP clients:", error);
    return [];
  }
}

/**
 * List tools from an MCP server
 */
export async function mcpListTools(serverId: string): Promise<MCPToolInfo[]> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const tools = await invoke<MCPToolInfo[]>("mcp_list_tools", { serverId });
    return tools;
  } catch (error) {
    console.error("Failed to list MCP tools:", error);
    throw error;
  }
}

/**
 * List resources from an MCP server
 */
export async function mcpListResources(
  serverId: string
): Promise<MCPResourceInfo[]> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const resources = await invoke<MCPResourceInfo[]>("mcp_list_resources", {
      serverId,
    });
    return resources;
  } catch (error) {
    console.error("Failed to list MCP resources:", error);
    throw error;
  }
}

/**
 * List prompts from an MCP server
 */
export async function mcpListPrompts(
  serverId: string
): Promise<MCPPromptInfo[]> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const prompts = await invoke<MCPPromptInfo[]>("mcp_list_prompts", {
      serverId,
    });
    return prompts;
  } catch (error) {
    console.error("Failed to list MCP prompts:", error);
    throw error;
  }
}

/**
 * Call a tool on an MCP server
 */
export async function mcpCallTool(params: {
  serverId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
}): Promise<MCPToolCallResult> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const result = await invoke<MCPToolCallResult>("mcp_call_tool", { params });
    return result;
  } catch (error) {
    console.error("Failed to call MCP tool:", error);
    throw error;
  }
}

/**
 * Read a resource from an MCP server
 */
export async function mcpReadResource(params: {
  serverId: string;
  uri: string;
}): Promise<MCPResourceReadResult> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const result = await invoke<MCPResourceReadResult>("mcp_read_resource", {
      params,
    });
    return result;
  } catch (error) {
    console.error("Failed to read MCP resource:", error);
    throw error;
  }
}

/**
 * Get a prompt from an MCP server
 */
export async function mcpGetPrompt(params: {
  serverId: string;
  promptName: string;
  arguments?: Record<string, string>;
}): Promise<MCPPromptGetResult> {
  if (!isTauri()) {
    throw new Error("MCP client is only available in Tauri desktop mode");
  }

  try {
    const result = await invoke<MCPPromptGetResult>("mcp_get_prompt", {
      params,
    });
    return result;
  } catch (error) {
    console.error("Failed to get MCP prompt:", error);
    throw error;
  }
}
