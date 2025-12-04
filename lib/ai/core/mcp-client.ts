/**
 * MCP (Model Context Protocol) Client Management
 *
 * This module provides a unified interface for MCP server connections:
 * - HTTP transport: Recommended for production web deployments
 * - SSE transport: Alternative HTTP-based transport
 * - Stdio transport: For local servers in Tauri desktop mode (via native rmcp SDK)
 *
 * The module automatically selects the appropriate transport based on:
 * - Server configuration type (http, sse, stdio)
 * - Runtime environment (browser vs Tauri desktop)
 *
 * @see https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
 * @see https://github.com/modelcontextprotocol/rust-sdk
 */

import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { tool } from "ai";
import { z } from "zod";
import { isTauri } from "@/lib/platform/tauri-bridge";
import {
  mcpConnect,
  mcpDisconnect,
  mcpListTools,
  mcpListResources,
  mcpListPrompts,
  mcpCallTool,
  mcpReadResource,
  mcpGetPrompt,
  mcpGetConnectedClients,
  type MCPToolInfo,
  type MCPClientInfo,
  type MCPResourceInfo,
  type MCPPromptInfo,
  type MCPResourceReadResult,
  type MCPPromptGetResult,
} from "@/lib/platform/tauri-bridge-ai";

// ============================================================================
// Types
// ============================================================================

/**
 * MCP server configuration
 * Supports HTTP, SSE, and Stdio transport types
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  type: "http" | "sse" | "stdio";
  enabled: boolean;
  // HTTP/SSE configuration
  url?: string;
  headers?: Record<string, string>;
  // OAuth configuration (for HTTP/SSE)
  authProvider?: unknown;
  // Stdio configuration (for local servers)
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // Metadata
  description?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Unified MCP client wrapper that abstracts transport differences
 */
export interface UnifiedMCPClient {
  readonly serverId: string;
  readonly serverName: string;
  readonly transportType: "http" | "sse" | "stdio";
  readonly isNative: boolean; // true if using Tauri/rmcp backend

  // Core operations
  tools(): Promise<Record<string, unknown>>;
  listResources(): Promise<MCPResourceInfo[]>;
  readResource(uri: string): Promise<MCPResourceReadResult | null>;
  listPrompts(): Promise<MCPPromptInfo[]>;
  getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<MCPPromptGetResult | null>;
  close(): Promise<void>;
}

// MCP Client instance type (AI SDK client)
export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

// Active MCP clients cache (AI SDK clients for HTTP/SSE)
const activeClients = new Map<string, MCPClient>();

// Unified client cache (wraps both AI SDK and native clients)
const unifiedClients = new Map<string, UnifiedMCPClient>();

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
 * Create a native MCP client wrapper for Stdio transport (Tauri mode only)
 * Uses the rmcp SDK via Tauri backend for process management
 */
async function createNativeStdioClient(
  config: MCPServerConfig
): Promise<UnifiedMCPClient | null> {
  if (!isTauri() || config.type !== "stdio" || !config.command) {
    return null;
  }

  try {
    // Connect via Tauri backend (rmcp SDK)
    const clientInfo = await mcpConnect({
      serverId: config.id,
      serverName: config.name,
      command: config.command,
      args: config.args,
      env: config.env,
    });

    // Create unified client wrapper
    const unifiedClient: UnifiedMCPClient = {
      serverId: config.id,
      serverName: config.name,
      transportType: "stdio",
      isNative: true,

      async tools() {
        const toolList = await mcpListTools(config.id);
        return createNativeMCPToolsForAI(config.id, config.name, toolList);
      },

      async listResources() {
        return mcpListResources(config.id);
      },

      async readResource(uri: string) {
        try {
          return await mcpReadResource({ serverId: config.id, uri });
        } catch (error) {
          console.error(`Failed to read resource ${uri}:`, error);
          return null;
        }
      },

      async listPrompts() {
        return mcpListPrompts(config.id);
      },

      async getPrompt(name: string, args?: Record<string, string>) {
        try {
          return await mcpGetPrompt({
            serverId: config.id,
            promptName: name,
            arguments: args,
          });
        } catch (error) {
          console.error(`Failed to get prompt ${name}:`, error);
          return null;
        }
      },

      async close() {
        await mcpDisconnect(config.id);
        unifiedClients.delete(config.id);
        nativeMCPToolsCache.delete(config.id);
      },
    };

    // Update connection status
    connectionStatus.set(config.id, "connected");

    // Cache tools if available
    if (clientInfo.capabilities.tools) {
      const tools = await mcpListTools(config.id);
      nativeMCPToolsCache.set(config.id, tools);
      toolsCache.set(
        config.id,
        tools.map((t) => t.name)
      );
    }

    return unifiedClient;
  } catch (error) {
    console.error(
      `Failed to create native stdio client for ${config.name}:`,
      error
    );
    connectionStatus.set(config.id, "error");
    connectionErrors.set(
      config.id,
      error instanceof Error ? error.message : "Connection failed"
    );
    return null;
  }
}

/**
 * Create a unified MCP client wrapper for HTTP/SSE transport
 * Uses the AI SDK MCP client
 */
async function createWebClient(
  config: MCPServerConfig
): Promise<UnifiedMCPClient | null> {
  if (!config.url) {
    return null;
  }

  try {
    const aiClient = await createMCPClient({
      transport: {
        type: config.type as "http" | "sse",
        url: config.url,
        headers: config.headers,
      },
    });

    // Store in AI SDK cache
    activeClients.set(config.id, aiClient);

    // Create unified client wrapper
    const unifiedClient: UnifiedMCPClient = {
      serverId: config.id,
      serverName: config.name,
      transportType: config.type as "http" | "sse",
      isNative: false,

      async tools() {
        return aiClient.tools();
      },

      async listResources(): Promise<MCPResourceInfo[]> {
        const resources = await aiClient.listResources();
        if (!Array.isArray(resources)) return [];
        return resources.map(
          (r: {
            uri: string;
            name: string;
            description?: string;
            mimeType?: string;
          }) => ({
            uri: r.uri,
            name: r.name,
            description: r.description ?? null,
            mimeType: r.mimeType ?? null,
          })
        );
      },

      async readResource(uri: string): Promise<MCPResourceReadResult | null> {
        try {
          const result = await aiClient.readResource({ uri });
          if (!result) return null;
          const contents = result.contents as Array<{
            uri: string;
            mimeType?: string;
            text?: string;
            blob?: string;
          }>;
          return {
            contents: contents.map((c) => ({
              uri: c.uri,
              mimeType: c.mimeType ?? null,
              text: c.text ?? null,
              blob: c.blob ?? null,
            })),
          };
        } catch (error) {
          console.error(`Failed to read resource ${uri}:`, error);
          return null;
        }
      },

      async listPrompts(): Promise<MCPPromptInfo[]> {
        const prompts = await aiClient.listPrompts();
        if (!Array.isArray(prompts)) return [];
        return prompts.map(
          (p: {
            name: string;
            description?: string;
            arguments?: Array<{
              name: string;
              description?: string;
              required?: boolean;
            }>;
          }) => ({
            name: p.name,
            description: p.description ?? null,
            arguments:
              p.arguments?.map((a) => ({
                name: a.name,
                description: a.description ?? null,
                required: a.required ?? false,
              })) ?? null,
          })
        );
      },

      async getPrompt(name: string, args?: Record<string, string>) {
        try {
          const result = await aiClient.getPrompt({ name, arguments: args });
          if (!result) return null;
          return {
            description: result.description ?? null,
            messages: result.messages.map((m) => ({
              role: m.role,
              content: {
                type: "text",
                text: typeof m.content === "string" ? m.content : null,
                data: null,
                mimeType: null,
              },
            })),
          };
        } catch (error) {
          console.error(`Failed to get prompt ${name}:`, error);
          return null;
        }
      },

      async close() {
        await aiClient.close();
        activeClients.delete(config.id);
        unifiedClients.delete(config.id);
      },
    };

    connectionStatus.set(config.id, "connected");
    return unifiedClient;
  } catch (error) {
    console.error(`Failed to create web client for ${config.name}:`, error);
    connectionStatus.set(config.id, "error");
    connectionErrors.set(
      config.id,
      error instanceof Error ? error.message : "Connection failed"
    );
    return null;
  }
}

/**
 * Create a unified MCP client based on server configuration
 * Automatically selects the appropriate transport and backend
 */
export async function createUnifiedMCPClient(
  config: MCPServerConfig
): Promise<UnifiedMCPClient | null> {
  if (!config.enabled) {
    return null;
  }

  // Check cache first
  if (unifiedClients.has(config.id)) {
    return unifiedClients.get(config.id) || null;
  }

  connectionStatus.set(config.id, "connecting");
  connectionErrors.delete(config.id);

  try {
    let client: UnifiedMCPClient | null = null;

    switch (config.type) {
      case "stdio":
        // Stdio requires Tauri desktop mode with rmcp backend
        if (!isTauri()) {
          throw new Error("Stdio transport requires Tauri desktop mode");
        }
        client = await createNativeStdioClient(config);
        break;

      case "http":
      case "sse":
        // HTTP/SSE works in both web and Tauri modes
        if (!config.url) {
          throw new Error(
            `${config.type.toUpperCase()} MCP server requires a URL`
          );
        }
        client = await createWebClient(config);
        break;

      default:
        throw new Error(`Unknown MCP transport type: ${config.type}`);
    }

    if (client) {
      unifiedClients.set(config.id, client);
    }

    return client;
  } catch (error) {
    console.error(`Failed to create MCP client for ${config.name}:`, error);
    connectionStatus.set(config.id, "error");
    connectionErrors.set(
      config.id,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Create an MCP client based on server configuration (legacy API)
 * @deprecated Use createUnifiedMCPClient instead
 */
export async function createMCPClientFromConfig(
  config: MCPServerConfig
): Promise<MCPClient | null> {
  if (!config.enabled) {
    return null;
  }

  // For HTTP/SSE, return the AI SDK client directly
  if (config.type === "http" || config.type === "sse") {
    if (!config.url) {
      console.error(`${config.type.toUpperCase()} MCP server requires a URL`);
      return null;
    }
    try {
      return await createMCPClient({
        transport: {
          type: config.type,
          url: config.url,
          headers: config.headers,
        },
      });
    } catch (error) {
      console.error(`Failed to create MCP client for ${config.name}:`, error);
      return null;
    }
  }

  // For stdio, we can't return an AI SDK client directly
  // The unified client should be used instead
  console.warn(
    "Stdio transport: Use createUnifiedMCPClient for full functionality"
  );
  return null;
}

/**
 * Get or create a unified MCP client for a server configuration
 */
export async function getUnifiedMCPClient(
  config: MCPServerConfig
): Promise<UnifiedMCPClient | null> {
  // Return cached client if available
  if (unifiedClients.has(config.id)) {
    return unifiedClients.get(config.id) || null;
  }

  // Create new client
  return createUnifiedMCPClient(config);
}

/**
 * Get or create an MCP client for a server configuration (legacy API)
 * @deprecated Use getUnifiedMCPClient instead
 */
export async function getMCPClient(
  config: MCPServerConfig
): Promise<MCPClient | null> {
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
 * Get tools from multiple MCP servers using unified clients
 * This is the recommended way to get all MCP tools
 */
export async function getAllMCPToolsUnified(
  configs: MCPServerConfig[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTools: Record<string, any> = {};

  for (const config of configs) {
    if (!config.enabled) continue;

    try {
      const client = await getUnifiedMCPClient(config);
      if (!client) continue;

      const tools = await client.tools();

      // Prefix tool names with server ID to avoid conflicts
      for (const [toolName, toolDef] of Object.entries(tools)) {
        // If already prefixed (from native client), use as-is
        const prefixedName = toolName.includes("__")
          ? toolName
          : `${config.id}__${toolName}`;
        allTools[prefixedName] = toolDef;
      }
    } catch (error) {
      console.error(`Failed to get tools from ${config.name}:`, error);
    }
  }

  return allTools;
}

/**
 * Get tools from multiple MCP servers (legacy API)
 * @deprecated Use getAllMCPToolsUnified instead
 */
export async function getAllMCPTools(
  configs: MCPServerConfig[]
): Promise<Record<string, Awaited<ReturnType<MCPClient["tools"]>>[string]>> {
  const allTools: Record<
    string,
    Awaited<ReturnType<MCPClient["tools"]>>[string]
  > = {};

  for (const config of configs) {
    if (!config.enabled) continue;

    // Skip stdio configs in legacy API (they need unified client)
    if (config.type === "stdio") {
      continue;
    }

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
 * Close a unified MCP client
 */
export async function closeUnifiedMCPClient(configId: string): Promise<void> {
  const client = unifiedClients.get(configId);
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error(`Failed to close unified MCP client ${configId}:`, error);
    }
    unifiedClients.delete(configId);
  }

  // Also clean up legacy client if exists
  const legacyClient = activeClients.get(configId);
  if (legacyClient) {
    try {
      await legacyClient.close();
    } catch (error) {
      console.error(`Failed to close legacy MCP client ${configId}:`, error);
    }
    activeClients.delete(configId);
  }

  // Clear caches
  connectionStatus.delete(configId);
  connectionErrors.delete(configId);
  toolsCache.delete(configId);
  nativeMCPToolsCache.delete(configId);
}

/**
 * Close an MCP client (legacy API)
 * @deprecated Use closeUnifiedMCPClient instead
 */
export async function closeMCPClient(configId: string): Promise<void> {
  return closeUnifiedMCPClient(configId);
}

/**
 * Close all active MCP clients
 */
export async function closeAllMCPClients(): Promise<void> {
  const unifiedClosePromises = Array.from(unifiedClients.keys()).map(
    closeUnifiedMCPClient
  );
  const legacyClosePromises = Array.from(activeClients.keys()).map((id) => {
    const client = activeClients.get(id);
    if (client) {
      return client
        .close()
        .catch((e) => console.error(`Failed to close legacy client ${id}:`, e));
    }
    return Promise.resolve();
  });

  await Promise.all([...unifiedClosePromises, ...legacyClosePromises]);

  // Clear all caches
  unifiedClients.clear();
  activeClients.clear();
  connectionStatus.clear();
  connectionErrors.clear();
  toolsCache.clear();
  nativeMCPToolsCache.clear();
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
export type MCPConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

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
 * Uses unified client for all transport types
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

    // Create unified client
    const client = await createUnifiedMCPClient({
      ...config,
      enabled: true,
    });

    if (!client) {
      const error = "Failed to connect to server";
      connectionStatus.set(config.id, "error");
      connectionErrors.set(config.id, error);
      return { success: false, tools: [], error };
    }

    // Fetch tools to verify connection
    const tools = await client.tools();
    const toolNames = Object.keys(tools);

    // Cache the results
    connectionStatus.set(config.id, "connected");
    toolsCache.set(config.id, toolNames);

    return { success: true, tools: toolNames };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
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
export const MCP_SERVER_PRESETS: Omit<
  MCPServerConfig,
  "id" | "createdAt" | "updatedAt"
>[] = [
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

// ============================================================================
// Native MCP Client Integration (Tauri/rmcp SDK)
// ============================================================================

// Cache for native MCP tools
const nativeMCPToolsCache = new Map<string, MCPToolInfo[]>();

/**
 * Get tools from native MCP client (Tauri mode only)
 */
export async function getNativeMCPTools(
  serverId: string
): Promise<MCPToolInfo[]> {
  if (!isTauri()) {
    return [];
  }

  // Check cache first
  if (nativeMCPToolsCache.has(serverId)) {
    return nativeMCPToolsCache.get(serverId) || [];
  }

  try {
    const tools = await mcpListTools(serverId);
    nativeMCPToolsCache.set(serverId, tools);
    return tools;
  } catch (error) {
    console.error(`Failed to get native MCP tools for ${serverId}:`, error);
    return [];
  }
}

/**
 * Clear native MCP tools cache for a server
 */
export function clearNativeMCPToolsCache(serverId?: string): void {
  if (serverId) {
    nativeMCPToolsCache.delete(serverId);
  } else {
    nativeMCPToolsCache.clear();
  }
}

/**
 * Get all connected native MCP clients
 */
export async function getConnectedNativeMCPClients(): Promise<MCPClientInfo[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    return await mcpGetConnectedClients();
  } catch (error) {
    console.error("Failed to get connected native MCP clients:", error);
    return [];
  }
}

/**
 * Connect to an MCP server (unified API)
 * Works for all transport types
 */
export async function connectMCPServer(
  config: MCPServerConfig
): Promise<UnifiedMCPClient | null> {
  return createUnifiedMCPClient(config);
}

/**
 * Connect to a native MCP server (Tauri mode only)
 * @deprecated Use connectMCPServer instead
 */
export async function connectNativeMCPServer(
  config: MCPServerConfig
): Promise<MCPClientInfo | null> {
  if (!isTauri() || config.type !== "stdio" || !config.command) {
    return null;
  }

  try {
    const clientInfo = await mcpConnect({
      serverId: config.id,
      serverName: config.name,
      command: config.command,
      args: config.args,
      env: config.env,
    });

    // Update connection status
    connectionStatus.set(config.id, "connected");

    // Fetch and cache tools
    if (clientInfo.capabilities.tools) {
      const tools = await mcpListTools(config.id);
      nativeMCPToolsCache.set(config.id, tools);
      toolsCache.set(
        config.id,
        tools.map((t) => t.name)
      );
    }

    return clientInfo;
  } catch (error) {
    console.error(
      `Failed to connect to native MCP server ${config.name}:`,
      error
    );
    connectionStatus.set(config.id, "error");
    connectionErrors.set(
      config.id,
      error instanceof Error ? error.message : "Connection failed"
    );
    return null;
  }
}

/**
 * Disconnect from an MCP server (unified API)
 */
export async function disconnectMCPServer(serverId: string): Promise<void> {
  return closeUnifiedMCPClient(serverId);
}

/**
 * Disconnect from a native MCP server
 * @deprecated Use disconnectMCPServer instead
 */
export async function disconnectNativeMCPServer(
  serverId: string
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    await mcpDisconnect(serverId);
    connectionStatus.set(serverId, "disconnected");
    nativeMCPToolsCache.delete(serverId);
    toolsCache.delete(serverId);
    unifiedClients.delete(serverId);
  } catch (error) {
    console.error(
      `Failed to disconnect from native MCP server ${serverId}:`,
      error
    );
  }
}

// Type for MCP tool result
interface MCPToolResult {
  success?: boolean;
  error?: boolean;
  result?: string;
  message?: string;
  content?: unknown;
}

/**
 * Create AI SDK compatible tools from native MCP tools
 * This converts native MCP tools to the format expected by Vercel AI SDK
 */
export function createNativeMCPToolsForAI(
  serverId: string,
  serverName: string,
  tools: MCPToolInfo[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiTools: Record<string, any> = {};

  for (const mcpTool of tools) {
    const toolName = `${serverId}__${mcpTool.name}`;

    // Create a dynamic schema from the input schema
    // For simplicity, we accept any JSON object as input
    const inputSchema = z.record(z.string(), z.unknown());

    aiTools[toolName] = tool({
      description:
        mcpTool.description || `MCP tool: ${mcpTool.name} from ${serverName}`,
      inputSchema,
      execute: async (
        args: Record<string, unknown>
      ): Promise<MCPToolResult> => {
        try {
          const result = await mcpCallTool({
            serverId,
            toolName: mcpTool.name,
            arguments: args,
          });

          if (result.isError) {
            return {
              error: true,
              content: result.content,
            };
          }

          // Extract text content from result
          const textContent = result.content
            .filter((c) => c.type === "text" && c.text)
            .map((c) => c.text)
            .join("\n");

          return {
            success: true,
            result: textContent || JSON.stringify(result.content),
          };
        } catch (error) {
          return {
            error: true,
            message:
              error instanceof Error ? error.message : "Tool execution failed",
          };
        }
      },
    });
  }

  return aiTools;
}

/**
 * Get all native MCP tools as AI SDK compatible tools
 * @deprecated Use getAllMCPToolsUnified instead
 */
export async function getAllNativeMCPToolsForAI(
  configs: MCPServerConfig[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  if (!isTauri()) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTools: Record<string, any> = {};

  // Get connected clients
  const connectedClients = await getConnectedNativeMCPClients();
  const connectedIds = new Set(connectedClients.map((c) => c.serverId));

  for (const config of configs) {
    if (!config.enabled || config.type !== "stdio") continue;

    // Only include tools from connected servers
    if (!connectedIds.has(config.id)) continue;

    const tools = await getNativeMCPTools(config.id);
    if (tools.length === 0) continue;

    const aiTools = createNativeMCPToolsForAI(config.id, config.name, tools);
    Object.assign(allTools, aiTools);
  }

  return allTools;
}

// ============================================================================
// Unified API Exports
// ============================================================================

/**
 * Get all connected MCP clients (unified)
 */
export async function getConnectedMCPClients(): Promise<UnifiedMCPClient[]> {
  return Array.from(unifiedClients.values());
}

/**
 * Check if a server is connected
 */
export function isServerConnected(serverId: string): boolean {
  return (
    unifiedClients.has(serverId) &&
    connectionStatus.get(serverId) === "connected"
  );
}

/**
 * Get server connection info
 */
export function getServerConnectionInfo(serverId: string): {
  status: MCPConnectionStatus;
  error?: string;
  tools: string[];
} {
  return {
    status: connectionStatus.get(serverId) || "disconnected",
    error: connectionErrors.get(serverId),
    tools: toolsCache.get(serverId) || [],
  };
}

// Re-export types for convenience
export type {
  MCPToolInfo,
  MCPClientInfo,
  MCPResourceInfo,
  MCPPromptInfo,
  MCPResourceReadResult,
  MCPPromptGetResult,
};
