"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai/core";
import { type MCPServerConfig, type MCPConnectionStatus } from "@/lib/ai/core";
import {
  mcpConnect,
  mcpDisconnect,
  mcpListTools,
  mcpGetConnectedClients,
  type MCPToolInfo,
  type MCPClientInfo,
} from "@/lib/platform/tauri-bridge-ai";
import { isTauri } from "@/lib/platform/tauri-bridge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Wrench,
  Search,
  ChevronDown,
  ChevronRight,
  Server,
  Plug,
  PlugZap,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Extended tool info with server context
export interface MCPToolWithServer extends MCPToolInfo {
  serverId: string;
  serverName: string;
  fullName: string; // serverId__toolName format
}

// Selected tools state
export interface SelectedMCPTools {
  tools: MCPToolWithServer[];
  serverIds: string[];
}

interface MCPToolSelectorProps {
  selectedTools: SelectedMCPTools;
  onSelectionChange: (selection: SelectedMCPTools) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function MCPToolSelector({
  selectedTools,
  onSelectionChange,
  disabled = false,
  compact = false,
}: MCPToolSelectorProps) {
  const { t } = useTranslation();
  const { settings } = useAIChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedServers, setExpandedServers] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [serverTools, setServerTools] = useState<Map<string, MCPToolInfo[]>>(
    new Map()
  );
  const [connectedClients, setConnectedClients] = useState<MCPClientInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    Map<string, MCPConnectionStatus>
  >(new Map());

  // Get enabled MCP servers from settings
  const enabledServers = useMemo(() => {
    return settings.mcpServers?.filter((s) => s.enabled) || [];
  }, [settings.mcpServers]);

  // Load connected clients and tools
  const loadMCPData = useCallback(async () => {
    if (!isTauri()) return;

    setIsLoading(true);
    try {
      // Get connected clients
      const clients = await mcpGetConnectedClients();
      setConnectedClients(clients);

      // Update connection status
      const statusMap = new Map<string, MCPConnectionStatus>();
      clients.forEach((client) => {
        statusMap.set(client.serverId, "connected");
      });
      enabledServers.forEach((server) => {
        if (!statusMap.has(server.id)) {
          statusMap.set(server.id, "disconnected");
        }
      });
      setConnectionStatus(statusMap);

      // Load tools for connected clients
      const toolsMap = new Map<string, MCPToolInfo[]>();
      for (const client of clients) {
        if (client.capabilities.tools) {
          try {
            const tools = await mcpListTools(client.serverId);
            toolsMap.set(client.serverId, tools);
          } catch (error) {
            console.error(
              `Failed to load tools for ${client.serverName}:`,
              error
            );
          }
        }
      }
      setServerTools(toolsMap);
    } catch (error) {
      console.error("Failed to load MCP data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [enabledServers]);

  // Load data when popover opens
  useEffect(() => {
    if (isOpen) {
      loadMCPData();
    }
  }, [isOpen, loadMCPData]);

  // Connect to a server
  const connectServer = async (server: MCPServerConfig) => {
    if (server.type !== "stdio" || !server.command) {
      console.warn("Only stdio servers are supported for native connection");
      return;
    }

    setConnectionStatus((prev) => new Map(prev).set(server.id, "connecting"));

    try {
      await mcpConnect({
        serverId: server.id,
        serverName: server.name,
        command: server.command,
        args: server.args,
        env: server.env,
      });

      // Reload data after connection
      await loadMCPData();
    } catch (error) {
      console.error(`Failed to connect to ${server.name}:`, error);
      setConnectionStatus((prev) => new Map(prev).set(server.id, "error"));
    }
  };

  // Disconnect from a server
  const disconnectServer = async (serverId: string) => {
    try {
      await mcpDisconnect(serverId);
      await loadMCPData();
    } catch (error) {
      console.error(`Failed to disconnect from ${serverId}:`, error);
    }
  };

  // Get all available tools with server info
  const allTools = useMemo(() => {
    const tools: MCPToolWithServer[] = [];

    serverTools.forEach((serverToolList, serverId) => {
      const server = enabledServers.find((s) => s.id === serverId);
      if (!server) return;

      serverToolList.forEach((tool) => {
        tools.push({
          ...tool,
          serverId,
          serverName: server.name,
          fullName: `${serverId}__${tool.name}`,
        });
      });
    });

    return tools;
  }, [serverTools, enabledServers]);

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools;

    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.serverName.toLowerCase().includes(query)
    );
  }, [allTools, searchQuery]);

  // Group tools by server
  const toolsByServer = useMemo(() => {
    const grouped = new Map<string, MCPToolWithServer[]>();

    filteredTools.forEach((tool) => {
      const existing = grouped.get(tool.serverId) || [];
      grouped.set(tool.serverId, [...existing, tool]);
    });

    return grouped;
  }, [filteredTools]);

  // Toggle tool selection
  const toggleTool = (tool: MCPToolWithServer) => {
    const isSelected = selectedTools.tools.some(
      (t) => t.fullName === tool.fullName
    );

    if (isSelected) {
      const newTools = selectedTools.tools.filter(
        (t) => t.fullName !== tool.fullName
      );
      const newServerIds = [...new Set(newTools.map((t) => t.serverId))];
      onSelectionChange({ tools: newTools, serverIds: newServerIds });
    } else {
      const newTools = [...selectedTools.tools, tool];
      const newServerIds = [...new Set(newTools.map((t) => t.serverId))];
      onSelectionChange({ tools: newTools, serverIds: newServerIds });
    }
  };

  // Toggle all tools from a server
  const toggleServerTools = (serverId: string) => {
    const serverToolList = toolsByServer.get(serverId) || [];
    const allSelected = serverToolList.every((tool) =>
      selectedTools.tools.some((t) => t.fullName === tool.fullName)
    );

    if (allSelected) {
      // Deselect all from this server
      const newTools = selectedTools.tools.filter(
        (t) => t.serverId !== serverId
      );
      const newServerIds = [...new Set(newTools.map((t) => t.serverId))];
      onSelectionChange({ tools: newTools, serverIds: newServerIds });
    } else {
      // Select all from this server
      const existingOtherTools = selectedTools.tools.filter(
        (t) => t.serverId !== serverId
      );
      const newTools = [...existingOtherTools, ...serverToolList];
      const newServerIds = [...new Set(newTools.map((t) => t.serverId))];
      onSelectionChange({ tools: newTools, serverIds: newServerIds });
    }
  };

  // Clear all selections
  const clearSelection = () => {
    onSelectionChange({ tools: [], serverIds: [] });
  };

  // Toggle server expansion
  const toggleServerExpansion = (serverId: string) => {
    setExpandedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  // Get status icon for server
  const getStatusIcon = (status: MCPConnectionStatus) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "connecting":
        return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Plug className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const selectedCount = selectedTools.tools.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          disabled={disabled || enabledServers.length === 0}
          className={cn("relative", selectedCount > 0 && "text-primary")}
        >
          <Wrench className="h-4 w-4" />
          {!compact && (
            <span className="ml-1.5">{t("ai.mcp.tools", "Tools")}</span>
          )}
          {selectedCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">
              {t("ai.mcp.selectTools", "Select MCP Tools")}
            </h4>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={loadMCPData}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={cn("h-3 w-3", isLoading && "animate-spin")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("ai.mcp.refresh", "Refresh")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearSelection}
                >
                  {t("ai.mcp.clearAll", "Clear")}
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("ai.mcp.searchTools", "Search tools...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : enabledServers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("ai.mcp.noServers", "No MCP servers configured")}</p>
              <p className="text-xs mt-1">
                {t("ai.mcp.configureHint", "Configure servers in AI Settings")}
              </p>
            </div>
          ) : allTools.length === 0 && connectedClients.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <PlugZap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("ai.mcp.noConnections", "No servers connected")}</p>
              <p className="text-xs mt-1">
                {t("ai.mcp.connectHint", "Connect to a server to use tools")}
              </p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>{t("ai.mcp.noResults", "No tools found")}</p>
            </div>
          ) : (
            <div className="p-2">
              {enabledServers.map((server) => {
                const status =
                  connectionStatus.get(server.id) || "disconnected";
                const tools = toolsByServer.get(server.id) || [];
                const isExpanded = expandedServers.has(server.id);
                const selectedFromServer = selectedTools.tools.filter(
                  (t) => t.serverId === server.id
                ).length;
                const allSelected =
                  tools.length > 0 &&
                  tools.every((tool) =>
                    selectedTools.tools.some(
                      (t) => t.fullName === tool.fullName
                    )
                  );

                return (
                  <Collapsible
                    key={server.id}
                    open={isExpanded}
                    onOpenChange={() => toggleServerExpansion(server.id)}
                  >
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      {status === "connected" && tools.length > 0 && (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleServerTools(server.id)}
                          className="h-4 w-4"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium truncate">
                            {server.name}
                          </span>
                          {selectedFromServer > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[10px]"
                            >
                              {selectedFromServer}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {status === "disconnected" && server.type === "stdio" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            connectServer(server);
                          }}
                        >
                          <Plug className="h-3 w-3 mr-1" />
                          {t("ai.mcp.connect", "Connect")}
                        </Button>
                      )}

                      {status === "connected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            disconnectServer(server.id);
                          }}
                        >
                          {t("ai.mcp.disconnect", "Disconnect")}
                        </Button>
                      )}
                    </div>

                    <CollapsibleContent>
                      {status === "connected" && tools.length > 0 ? (
                        <div className="ml-6 space-y-1 pb-2">
                          {tools.map((tool) => {
                            const isSelected = selectedTools.tools.some(
                              (t) => t.fullName === tool.fullName
                            );

                            return (
                              <div
                                key={tool.fullName}
                                className={cn(
                                  "flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-muted/50"
                                )}
                                onClick={() => toggleTool(tool)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="mt-0.5 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Zap className="h-3 w-3 text-yellow-500" />
                                    <span className="text-sm font-medium">
                                      {tool.name}
                                    </span>
                                  </div>
                                  {tool.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {tool.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : status === "connected" ? (
                        <div className="ml-6 p-2 text-xs text-muted-foreground">
                          {t("ai.mcp.noToolsAvailable", "No tools available")}
                        </div>
                      ) : status === "connecting" ? (
                        <div className="ml-6 p-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t("ai.mcp.connecting", "Connecting...")}
                        </div>
                      ) : status === "error" ? (
                        <div className="ml-6 p-2 text-xs text-red-500">
                          {t("ai.mcp.connectionError", "Connection failed")}
                        </div>
                      ) : (
                        <div className="ml-6 p-2 text-xs text-muted-foreground">
                          {t("ai.mcp.notConnected", "Not connected")}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {selectedCount > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <div className="flex flex-wrap gap-1">
              {selectedTools.tools.slice(0, 5).map((tool) => (
                <Badge
                  key={tool.fullName}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleTool(tool)}
                >
                  {tool.name}
                  <span className="ml-1 opacity-50">×</span>
                </Badge>
              ))}
              {selectedCount > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedCount - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Export default selection
export const DEFAULT_MCP_SELECTION: SelectedMCPTools = {
  tools: [],
  serverIds: [],
};
