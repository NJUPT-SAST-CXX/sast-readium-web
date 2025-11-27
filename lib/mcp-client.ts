/**
 * MCP (Model Context Protocol) Client Management
 * 
 * This module handles MCP server connections with support for:
 * - HTTP/SSE transport for web deployment
 * - Stdio transport for local/Tauri desktop mode
 */

import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { isTauri } from "./tauri-bridge";

// Types for MCP server configuration
export interface MCPServerConfig {
  id: string;
  name: string;
  type: "http" | "sse" | "stdio";
  enabled: boolean;
  // HTTP/SSE configuration
  url?: string;
  headers?: Record<string, string>;
  // Stdio configuration (for local servers)
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // Metadata
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// MCP Client instance type
export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

// Active MCP clients cache
const activeClients = new Map<string, MCPClient>();

/**
 * Create an MCP client with HTTP transport
 */
export async function createHTTPMCPClient(config: {
  url: string;
  headers?: Record<string, string>;
}): Promise<MCPClient> {
  const client = await createMCPClient({
    transport: {
      type: "http",
      url: config.url,
      headers: config.headers,
    },
  });
  
  return client;
}

/**
 * Create an MCP client with SSE transport
 */
export async function createSSEMCPClient(config: {
  url: string;
  headers?: Record<string, string>;
}): Promise<MCPClient> {
  const client = await createMCPClient({
    transport: {
      type: "sse",
      url: config.url,
      headers: config.headers,
    },
  });
  
  return client;
}

/**
 * Create an MCP client with Stdio transport (local mode only)
 * This is only available in Tauri desktop mode
 * 
 * Note: Stdio transport requires Node.js and is not available in browser environments.
 * In Tauri mode, we would invoke the Tauri backend to spawn the MCP server process.
 */
export async function createStdioMCPClient(config: {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}): Promise<MCPClient | null> {
  // Stdio transport only works in local/Tauri mode
  if (!isTauri()) {
    console.warn("Stdio MCP transport is only available in Tauri desktop mode");
    return null;
  }
  
  // In browser/Next.js environment, we cannot use stdio directly
  // The Tauri backend would need to handle the process spawning
  // For now, we log a message and return null
  // In a future implementation, this would communicate with Tauri's Rust backend
  // to spawn and manage the MCP server process
  console.warn("Stdio MCP transport: Tauri backend integration required for process spawning");
  console.info("MCP server config:", config);
  
  // Placeholder for future Tauri integration
  // The implementation would involve:
  // 1. Sending the command/args to Tauri backend via invoke()
  // 2. Tauri backend spawns the process and sets up IPC
  // 3. Return a client that communicates through Tauri's IPC
  
  return null;
}

/**
 * Create an MCP client based on server configuration
 */
export async function createMCPClientFromConfig(
  config: MCPServerConfig
): Promise<MCPClient | null> {
  if (!config.enabled) {
    return null;
  }
  
  try {
    switch (config.type) {
      case "http":
        if (!config.url) {
          throw new Error("HTTP MCP server requires a URL");
        }
        return await createHTTPMCPClient({
          url: config.url,
          headers: config.headers,
        });
        
      case "sse":
        if (!config.url) {
          throw new Error("SSE MCP server requires a URL");
        }
        return await createSSEMCPClient({
          url: config.url,
          headers: config.headers,
        });
        
      case "stdio":
        if (!config.command) {
          throw new Error("Stdio MCP server requires a command");
        }
        return await createStdioMCPClient({
          command: config.command,
          args: config.args,
          env: config.env,
        });
        
      default:
        throw new Error(`Unknown MCP transport type: ${config.type}`);
    }
  } catch (error) {
    console.error(`Failed to create MCP client for ${config.name}:`, error);
    return null;
  }
}

/**
 * Get or create an MCP client for a server configuration
 */
export async function getMCPClient(config: MCPServerConfig): Promise<MCPClient | null> {
  // Return cached client if available
  if (activeClients.has(config.id)) {
    return activeClients.get(config.id) || null;
  }
  
  // Create new client
  const client = await createMCPClientFromConfig(config);
  
  if (client) {
    activeClients.set(config.id, client);
  }
  
  return client;
}

/**
 * Get tools from an MCP client
 */
export async function getMCPTools(client: MCPClient) {
  try {
    const tools = await client.tools();
    return tools;
  } catch (error) {
    console.error("Failed to get MCP tools:", error);
    return {};
  }
}

/**
 * Get tools from multiple MCP servers
 */
export async function getAllMCPTools(
  configs: MCPServerConfig[]
): Promise<Record<string, Awaited<ReturnType<MCPClient["tools"]>>[string]>> {
  const allTools: Record<string, Awaited<ReturnType<MCPClient["tools"]>>[string]> = {};
  
  for (const config of configs) {
    if (!config.enabled) continue;
    
    const client = await getMCPClient(config);
    if (!client) continue;
    
    try {
      const tools = await getMCPTools(client);
      
      // Prefix tool names with server ID to avoid conflicts
      for (const [toolName, tool] of Object.entries(tools)) {
        const prefixedName = `${config.id}__${toolName}`;
        allTools[prefixedName] = tool;
      }
    } catch (error) {
      console.error(`Failed to get tools from ${config.name}:`, error);
    }
  }
  
  return allTools;
}

/**
 * Close an MCP client
 */
export async function closeMCPClient(configId: string): Promise<void> {
  const client = activeClients.get(configId);
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error(`Failed to close MCP client ${configId}:`, error);
    }
    activeClients.delete(configId);
  }
}

/**
 * Close all active MCP clients
 */
export async function closeAllMCPClients(): Promise<void> {
  const closePromises = Array.from(activeClients.keys()).map(closeMCPClient);
  await Promise.all(closePromises);
}

/**
 * List resources from an MCP server
 */
export async function listMCPResources(client: MCPClient) {
  try {
    return await client.listResources();
  } catch (error) {
    console.error("Failed to list MCP resources:", error);
    return [];
  }
}

/**
 * Read a resource from an MCP server
 */
export async function readMCPResource(client: MCPClient, uri: string) {
  try {
    return await client.readResource({ uri });
  } catch (error) {
    console.error(`Failed to read MCP resource ${uri}:`, error);
    return null;
  }
}

/**
 * List prompts from an MCP server
 */
export async function listMCPPrompts(client: MCPClient) {
  try {
    return await client.listPrompts();
  } catch (error) {
    console.error("Failed to list MCP prompts:", error);
    return [];
  }
}

/**
 * Get a prompt from an MCP server
 */
export async function getMCPPrompt(
  client: MCPClient,
  name: string,
  args?: Record<string, string>
) {
  try {
    return await client.getPrompt({ name, arguments: args });
  } catch (error) {
    console.error(`Failed to get MCP prompt ${name}:`, error);
    return null;
  }
}

/**
 * Check if MCP is available in current environment
 */
export function isMCPAvailable(): boolean {
  // MCP is always available for HTTP/SSE
  // Stdio is only available in Tauri mode
  return true;
}

// MCP Server connection status
export type MCPConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// Connection status cache
const connectionStatus = new Map<string, MCPConnectionStatus>();
const connectionErrors = new Map<string, string>();
const toolsCache = new Map<string, string[]>();

/**
 * Get the connection status of an MCP server
 */
export function getMCPConnectionStatus(configId: string): MCPConnectionStatus {
  return connectionStatus.get(configId) || "disconnected";
}

/**
 * Get connection error message if any
 */
export function getMCPConnectionError(configId: string): string | undefined {
  return connectionErrors.get(configId);
}

/**
 * Get cached tools for a server
 */
export function getCachedMCPTools(configId: string): string[] {
  return toolsCache.get(configId) || [];
}

/**
 * Test MCP server connection and fetch available tools
 */
export async function testMCPConnection(
  config: MCPServerConfig
): Promise<{ success: boolean; tools: string[]; error?: string }> {
  connectionStatus.set(config.id, "connecting");
  connectionErrors.delete(config.id);
  
  try {
    // For stdio servers, check if Tauri is available
    if (config.type === "stdio" && !isTauri()) {
      const error = "Stdio transport requires Tauri desktop mode";
      connectionStatus.set(config.id, "error");
      connectionErrors.set(config.id, error);
      return { success: false, tools: [], error };
    }
    
    // Try to create client and fetch tools
    const client = await createMCPClientFromConfig({ ...config, enabled: true });
    
    if (!client) {
      const error = config.type === "stdio" 
        ? "Stdio transport not yet implemented" 
        : "Failed to connect to server";
      connectionStatus.set(config.id, "error");
      connectionErrors.set(config.id, error);
      return { success: false, tools: [], error };
    }
    
    // Fetch tools to verify connection
    const tools = await getMCPTools(client);
    const toolNames = Object.keys(tools);
    
    // Cache the results
    connectionStatus.set(config.id, "connected");
    toolsCache.set(config.id, toolNames);
    
    // Store client for reuse
    activeClients.set(config.id, client);
    
    return { success: true, tools: toolNames };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    connectionStatus.set(config.id, "error");
    connectionErrors.set(config.id, errorMessage);
    return { success: false, tools: [], error: errorMessage };
  }
}

/**
 * Clear connection status for a server
 */
export function clearMCPConnectionStatus(configId: string): void {
  connectionStatus.delete(configId);
  connectionErrors.delete(configId);
  toolsCache.delete(configId);
}

/**
 * Check if stdio MCP is available (Tauri mode only)
 */
export function isStdioMCPAvailable(): boolean {
  return isTauri();
}

/**
 * Default MCP server presets
 */
export const MCP_SERVER_PRESETS: Omit<MCPServerConfig, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Filesystem (Local)",
    type: "stdio",
    enabled: false,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    description: "Access local filesystem (requires Tauri desktop mode)",
  },
  {
    name: "GitHub",
    type: "stdio", 
    enabled: false,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: "",
    },
    description: "Access GitHub repositories and issues",
  },
  {
    name: "Memory",
    type: "stdio",
    enabled: false,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    description: "Persistent memory for conversations",
  },
  {
    name: "Brave Search",
    type: "stdio",
    enabled: false,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: {
      BRAVE_API_KEY: "",
    },
    description: "Web search using Brave Search API",
  },
  {
    name: "Fetch",
    type: "stdio",
    enabled: false,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    description: "Fetch and parse web content",
  },
];

/**
 * Create a new MCP server config from preset
 */
export function createMCPServerFromPreset(
  presetIndex: number
): MCPServerConfig | null {
  const preset = MCP_SERVER_PRESETS[presetIndex];
  if (!preset) return null;
  
  const now = Date.now();
  return {
    ...preset,
    id: `mcp_${now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a custom MCP server config
 */
export function createCustomMCPServer(
  config: Omit<MCPServerConfig, "id" | "createdAt" | "updatedAt">
): MCPServerConfig {
  const now = Date.now();
  return {
    ...config,
    id: `mcp_${now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
}
