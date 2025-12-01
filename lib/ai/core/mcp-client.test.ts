/**
 * Tests for MCP (Model Context Protocol) Client Management
 */

import {
  createHTTPMCPClient,
  createSSEMCPClient,
  createStdioMCPClient,
  createMCPClientFromConfig,
  getMCPClient,
  getMCPTools,
  getAllMCPTools,
  closeMCPClient,
  closeAllMCPClients,
  listMCPResources,
  readMCPResource,
  listMCPPrompts,
  getMCPPrompt,
  isMCPAvailable,
  getMCPConnectionStatus,
  getMCPConnectionError,
  getCachedMCPTools,
  testMCPConnection,
  clearMCPConnectionStatus,
  isStdioMCPAvailable,
  type MCPServerConfig,
} from "./mcp-client";

// Mock the MCP client
const mockMCPClient = {
  tools: jest.fn(),
  close: jest.fn(),
  listResources: jest.fn(),
  readResource: jest.fn(),
  listPrompts: jest.fn(),
  getPrompt: jest.fn(),
};

jest.mock("@ai-sdk/mcp", () => ({
  experimental_createMCPClient: jest.fn(() => Promise.resolve(mockMCPClient)),
}));

jest.mock("@/lib/platform/tauri-bridge", () => ({
  isTauri: jest.fn(() => false),
}));

import { isTauri } from "@/lib/platform/tauri-bridge";

const mockIsTauri = isTauri as jest.MockedFunction<typeof isTauri>;

describe("MCP Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(false);
    mockMCPClient.tools.mockResolvedValue({});
    mockMCPClient.close.mockResolvedValue(undefined);
    mockMCPClient.listResources.mockResolvedValue([]);
    mockMCPClient.readResource.mockResolvedValue(null);
    mockMCPClient.listPrompts.mockResolvedValue([]);
    mockMCPClient.getPrompt.mockResolvedValue(null);
  });

  describe("createHTTPMCPClient", () => {
    it("should create HTTP MCP client", async () => {
      const client = await createHTTPMCPClient({
        url: "https://mcp.example.com",
      });

      expect(client).toBeDefined();
    });

    it("should pass headers to HTTP client", async () => {
      const client = await createHTTPMCPClient({
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
      });

      expect(client).toBeDefined();
    });
  });

  describe("createSSEMCPClient", () => {
    it("should create SSE MCP client", async () => {
      const client = await createSSEMCPClient({
        url: "https://mcp.example.com/sse",
      });

      expect(client).toBeDefined();
    });

    it("should pass headers to SSE client", async () => {
      const client = await createSSEMCPClient({
        url: "https://mcp.example.com/sse",
        headers: { "X-API-Key": "key123" },
      });

      expect(client).toBeDefined();
    });
  });

  describe("createStdioMCPClient", () => {
    it("should return null in browser mode", async () => {
      mockIsTauri.mockReturnValue(false);

      const client = await createStdioMCPClient({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
      });

      expect(client).toBeNull();
    });

    it("should log warning in Tauri mode (not fully implemented)", async () => {
      mockIsTauri.mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const client = await createStdioMCPClient({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createMCPClientFromConfig", () => {
    it("should return null for disabled config", async () => {
      const config: MCPServerConfig = {
        id: "test-server",
        name: "Test Server",
        type: "http",
        enabled: false,
        url: "https://mcp.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client = await createMCPClientFromConfig(config);

      expect(client).toBeNull();
    });

    it("should create HTTP client from config", async () => {
      const config: MCPServerConfig = {
        id: "test-server",
        name: "Test Server",
        type: "http",
        enabled: true,
        url: "https://mcp.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client = await createMCPClientFromConfig(config);

      expect(client).toBeDefined();
    });

    it("should create SSE client from config", async () => {
      const config: MCPServerConfig = {
        id: "test-server",
        name: "Test Server",
        type: "sse",
        enabled: true,
        url: "https://mcp.example.com/sse",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client = await createMCPClientFromConfig(config);

      expect(client).toBeDefined();
    });

    it("should throw error for HTTP config without URL", async () => {
      const config: MCPServerConfig = {
        id: "test-server",
        name: "Test Server",
        type: "http",
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client = await createMCPClientFromConfig(config);

      // Should return null after catching error
      expect(client).toBeNull();
    });

    it("should throw error for stdio config without command", async () => {
      mockIsTauri.mockReturnValue(true);
      const config: MCPServerConfig = {
        id: "test-server",
        name: "Test Server",
        type: "stdio",
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client = await createMCPClientFromConfig(config);

      expect(client).toBeNull();
    });
  });

  describe("getMCPClient", () => {
    it("should cache and return same client", async () => {
      const config: MCPServerConfig = {
        id: "cached-server",
        name: "Cached Server",
        type: "http",
        enabled: true,
        url: "https://mcp.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const client1 = await getMCPClient(config);
      const client2 = await getMCPClient(config);

      expect(client1).toBe(client2);
    });
  });

  describe("getMCPTools", () => {
    it("should return tools from client", async () => {
      const mockTools = {
        tool1: { description: "Tool 1" },
        tool2: { description: "Tool 2" },
      };
      mockMCPClient.tools.mockResolvedValue(mockTools);

      const tools = await getMCPTools(mockMCPClient as any);

      expect(tools).toEqual(mockTools);
    });

    it("should return empty object on error", async () => {
      mockMCPClient.tools.mockRejectedValue(new Error("Failed"));

      const tools = await getMCPTools(mockMCPClient as any);

      expect(tools).toEqual({});
    });
  });

  describe("getAllMCPTools", () => {
    it("should return tools from multiple servers with prefixed names", async () => {
      const mockTools = {
        tool1: { description: "Tool 1" },
      };
      mockMCPClient.tools.mockResolvedValue(mockTools);

      const configs: MCPServerConfig[] = [
        {
          id: "server1",
          name: "Server 1",
          type: "http",
          enabled: true,
          url: "https://mcp1.example.com",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const tools = await getAllMCPTools(configs);

      expect(tools).toHaveProperty("server1__tool1");
    });

    it("should skip disabled servers", async () => {
      const configs: MCPServerConfig[] = [
        {
          id: "disabled-server",
          name: "Disabled Server",
          type: "http",
          enabled: false,
          url: "https://mcp.example.com",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const tools = await getAllMCPTools(configs);

      expect(Object.keys(tools)).toHaveLength(0);
    });
  });

  describe("closeMCPClient", () => {
    it("should close and remove client from cache", async () => {
      const config: MCPServerConfig = {
        id: "close-test",
        name: "Close Test",
        type: "http",
        enabled: true,
        url: "https://mcp.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await getMCPClient(config);
      await closeMCPClient("close-test");

      expect(mockMCPClient.close).toHaveBeenCalled();
    });

    it("should handle non-existent client gracefully", async () => {
      await expect(closeMCPClient("non-existent")).resolves.toBeUndefined();
    });
  });

  describe("closeAllMCPClients", () => {
    it("should close all active clients", async () => {
      const config1: MCPServerConfig = {
        id: "server1",
        name: "Server 1",
        type: "http",
        enabled: true,
        url: "https://mcp1.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await getMCPClient(config1);
      await closeAllMCPClients();

      expect(mockMCPClient.close).toHaveBeenCalled();
    });
  });

  describe("listMCPResources", () => {
    it("should return resources from client", async () => {
      const mockResources = [{ uri: "file:///test.txt", name: "test.txt" }];
      mockMCPClient.listResources.mockResolvedValue(mockResources);

      const resources = await listMCPResources(mockMCPClient as any);

      expect(resources).toEqual(mockResources);
    });

    it("should return empty array on error", async () => {
      mockMCPClient.listResources.mockRejectedValue(new Error("Failed"));

      const resources = await listMCPResources(mockMCPClient as any);

      expect(resources).toEqual([]);
    });
  });

  describe("readMCPResource", () => {
    it("should read resource from client", async () => {
      const mockContent = { contents: [{ text: "Hello" }] };
      mockMCPClient.readResource.mockResolvedValue(mockContent);

      const content = await readMCPResource(
        mockMCPClient as any,
        "file:///test.txt"
      );

      expect(content).toEqual(mockContent);
    });

    it("should return null on error", async () => {
      mockMCPClient.readResource.mockRejectedValue(new Error("Failed"));

      const content = await readMCPResource(
        mockMCPClient as any,
        "file:///test.txt"
      );

      expect(content).toBeNull();
    });
  });

  describe("listMCPPrompts", () => {
    it("should return prompts from client", async () => {
      const mockPrompts = [
        { name: "greeting", description: "A greeting prompt" },
      ];
      mockMCPClient.listPrompts.mockResolvedValue(mockPrompts);

      const prompts = await listMCPPrompts(mockMCPClient as any);

      expect(prompts).toEqual(mockPrompts);
    });

    it("should return empty array on error", async () => {
      mockMCPClient.listPrompts.mockRejectedValue(new Error("Failed"));

      const prompts = await listMCPPrompts(mockMCPClient as any);

      expect(prompts).toEqual([]);
    });
  });

  describe("getMCPPrompt", () => {
    it("should get prompt from client", async () => {
      const mockPrompt = { messages: [{ role: "user", content: "Hello" }] };
      mockMCPClient.getPrompt.mockResolvedValue(mockPrompt);

      const prompt = await getMCPPrompt(mockMCPClient as any, "greeting", {
        name: "World",
      });

      expect(prompt).toEqual(mockPrompt);
    });

    it("should return null on error", async () => {
      mockMCPClient.getPrompt.mockRejectedValue(new Error("Failed"));

      const prompt = await getMCPPrompt(mockMCPClient as any, "greeting");

      expect(prompt).toBeNull();
    });
  });

  describe("isMCPAvailable", () => {
    it("should return true", () => {
      expect(isMCPAvailable()).toBe(true);
    });
  });

  describe("getMCPConnectionStatus", () => {
    it("should return disconnected for unknown server", () => {
      const status = getMCPConnectionStatus("unknown-server");

      expect(status).toBe("disconnected");
    });
  });

  describe("getMCPConnectionError", () => {
    it("should return undefined for server without error", () => {
      const error = getMCPConnectionError("unknown-server");

      expect(error).toBeUndefined();
    });
  });

  describe("getCachedMCPTools", () => {
    it("should return empty array for unknown server", () => {
      const tools = getCachedMCPTools("unknown-server");

      expect(tools).toEqual([]);
    });
  });

  describe("testMCPConnection", () => {
    it("should test HTTP connection successfully", async () => {
      mockMCPClient.tools.mockResolvedValue({
        tool1: { description: "Tool 1" },
      });

      const config: MCPServerConfig = {
        id: "test-connection",
        name: "Test Connection",
        type: "http",
        enabled: true,
        url: "https://mcp.example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await testMCPConnection(config);

      expect(result.success).toBe(true);
      expect(result.tools).toContain("tool1");
    });

    it("should fail for stdio in browser mode", async () => {
      mockIsTauri.mockReturnValue(false);

      const config: MCPServerConfig = {
        id: "stdio-test",
        name: "Stdio Test",
        type: "stdio",
        enabled: true,
        command: "npx",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await testMCPConnection(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Tauri");
    });
  });

  describe("clearMCPConnectionStatus", () => {
    it("should clear connection status for server", () => {
      clearMCPConnectionStatus("test-server");

      expect(getMCPConnectionStatus("test-server")).toBe("disconnected");
    });
  });

  describe("isStdioMCPAvailable", () => {
    it("should return false in browser mode", () => {
      mockIsTauri.mockReturnValue(false);

      expect(isStdioMCPAvailable()).toBe(false);
    });

    it("should return true in Tauri mode", () => {
      mockIsTauri.mockReturnValue(true);

      expect(isStdioMCPAvailable()).toBe(true);
    });
  });
});
