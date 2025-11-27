"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  useAIChatStore, 
  AI_MODELS, 
  PRESET_PROVIDERS, 
  SYSTEM_PROMPT_PRESETS,
  TEMPLATE_VARIABLES,
  type AIProvider, 
  type CustomProvider, 
  type BuiltInProvider,
  type QuickCommand,
  type PromptTemplate,
} from "@/lib/ai-chat-store";
import {
  MCP_SERVER_PRESETS,
  createMCPServerFromPreset,
  createCustomMCPServer,
  testMCPConnection,
  getMCPConnectionStatus,
  getCachedMCPTools,
  closeMCPClient,
  clearMCPConnectionStatus,
  isStdioMCPAvailable,
  type MCPServerConfig,
  type MCPConnectionStatus,
} from "@/lib/mcp-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  saveAPIKeySecurely,
  getAPIKeySecurely,
  deleteAPIKeySecurely,
  getStorageRecommendation,
} from "@/lib/tauri-bridge-ai";
import { validateAPIKey, testConnection } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Server,
  Globe,
  Plug,
  PlugZap,
  Terminal,
  Radio,
  RefreshCw,
  Wrench,
  X,
  Zap,
  FileText,
  Languages,
  Lightbulb,
  List,
  HelpCircle,
  BookOpen,
  GitCompare,
  Pencil,
  RotateCcw,
  Copy,
  Hash,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";

export function AISettingsPanel() {
  const { t } = useTranslation();
  const {
    settings,
    updateSettings,
    setAPIKey,
    addCustomProvider,
    deleteCustomProvider,
    addPresetProvider,
    addMCPServer,
    deleteMCPServer,
    toggleMCPServer,
  } = useAIChatStore();

  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [customProviderKeys, setCustomProviderKeys] = useState<Record<string, string>>({});
  const [showCustomKeys, setShowCustomKeys] = useState<Record<string, boolean>>({});
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<CustomProvider>>({
    name: "",
    baseURL: "",
    models: [],
  });
  const [newModelInput, setNewModelInput] = useState({ id: "", name: "", contextWindow: 128000 });

  // MCP Server management state
  const [addMCPServerOpen, setAddMCPServerOpen] = useState(false);
  const [mcpConnectionStates, setMcpConnectionStates] = useState<Record<string, MCPConnectionStatus>>({});
  const [mcpToolsCounts, setMcpToolsCounts] = useState<Record<string, number>>({});
  const [testingMCPServer, setTestingMCPServer] = useState<string | null>(null);
  const [newMCPServer, setNewMCPServer] = useState<{
    name: string;
    type: "http" | "sse" | "stdio";
    url: string;
    command: string;
    args: string;
    description: string;
    headers: Array<{ key: string; value: string }>;
    env: Array<{ key: string; value: string }>;
  }>({
    name: "",
    type: "http",
    url: "",
    command: "",
    args: "",
    description: "",
    headers: [],
    env: [],
  });

  const storageInfo = getStorageRecommendation();

  // Load API keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const openai = await getAPIKeySecurely("openai");
        const anthropic = await getAPIKeySecurely("anthropic");

        if (openai) {
          setOpenaiKey(openai);
          setAPIKey("openai", openai);
        }
        if (anthropic) {
          setAnthropicKey(anthropic);
          setAPIKey("anthropic", anthropic);
        }
      } catch (error) {
        console.error("Failed to load API keys:", error);
      }
    };

    loadKeys();
  }, [setAPIKey]);

  // Safe access to custom providers (for backwards compatibility with persisted state)
  const customProviders = useMemo(() => settings.customProviders || [], [settings.customProviders]);

  // Load custom provider keys
  useEffect(() => {
    const loadCustomKeys = async () => {
      const keys: Record<string, string> = {};
      for (const provider of customProviders) {
        try {
          // Now supports any provider ID (not just built-in)
          const key = await getAPIKeySecurely(provider.id);
          if (key) keys[provider.id] = key;
        } catch {
          // Key not found in secure storage, check settings
          if (settings.apiKeys?.[provider.id]) {
            keys[provider.id] = settings.apiKeys[provider.id];
          }
        }
      }
      setCustomProviderKeys(keys);
    };
    loadCustomKeys();
  }, [customProviders, settings.apiKeys]);

  const handleSaveAPIKey = async (provider: AIProvider) => {
    setIsSaving(true);
    setTestResult(null);

    try {
      const key = provider === "openai" ? openaiKey : anthropicKey;

      if (!validateAPIKey(provider, key)) {
        setTestResult({
          success: false,
          message: t("ai.invalid_api_key_format"),
        });
        setIsSaving(false);
        return;
      }

      await saveAPIKeySecurely(provider, key);
      setAPIKey(provider, key);

      setTestResult({
        success: true,
        message: t("ai.api_key_saved"),
      });
    } catch {
      setTestResult({
        success: false,
        message: t("ai.failed_to_save_api_key"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAPIKey = async (provider: AIProvider) => {
    if (!confirm(t("ai.confirm_delete_api_key"))) {
      return;
    }

    try {
      await deleteAPIKeySecurely(provider);
      setAPIKey(provider, "");

      if (provider === "openai") {
        setOpenaiKey("");
      } else {
        setAnthropicKey("");
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const apiKey = settings.apiKeys?.[settings.provider];
      if (!apiKey) {
        setTestResult({
          success: false,
          message: t("ai.no_api_key_configured"),
        });
        setIsTesting(false);
        return;
      }

      const success = await testConnection({
        provider: settings.provider,
        model: settings.model,
        apiKey,
      });

      setTestResult({
        success,
        message: success
          ? t("ai.connection_successful")
          : t("ai.connection_failed"),
      });
    } catch {
      setTestResult({
        success: false,
        message: t("ai.connection_failed"),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // MCP Server management functions
  const handleTestMCPServer = async (server: MCPServerConfig) => {
    setTestingMCPServer(server.id);
    setMcpConnectionStates(prev => ({ ...prev, [server.id]: "connecting" }));
    
    try {
      const result = await testMCPConnection(server);
      setMcpConnectionStates(prev => ({ 
        ...prev, 
        [server.id]: result.success ? "connected" : "error" 
      }));
      if (result.success) {
        setMcpToolsCounts(prev => ({ ...prev, [server.id]: result.tools.length }));
      }
    } catch {
      setMcpConnectionStates(prev => ({ ...prev, [server.id]: "error" }));
    } finally {
      setTestingMCPServer(null);
    }
  };

  const handleAddMCPPreset = (presetIndex: number) => {
    const server = createMCPServerFromPreset(presetIndex);
    if (server) {
      addMCPServer(server);
      setAddMCPServerOpen(false);
    }
  };

  const handleAddCustomMCPServer = () => {
    if (!newMCPServer.name) return;
    
    const headers: Record<string, string> = {};
    newMCPServer.headers.forEach(h => {
      if (h.key && h.value) headers[h.key] = h.value;
    });
    
    const env: Record<string, string> = {};
    newMCPServer.env.forEach(e => {
      if (e.key) env[e.key] = e.value;
    });

    const server = createCustomMCPServer({
      name: newMCPServer.name,
      type: newMCPServer.type,
      enabled: true,
      url: newMCPServer.type !== "stdio" ? newMCPServer.url : undefined,
      command: newMCPServer.type === "stdio" ? newMCPServer.command : undefined,
      args: newMCPServer.type === "stdio" && newMCPServer.args 
        ? newMCPServer.args.split(" ").filter(Boolean) 
        : undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      env: Object.keys(env).length > 0 ? env : undefined,
      description: newMCPServer.description || undefined,
    });
    
    addMCPServer(server);
    setNewMCPServer({
      name: "",
      type: "http",
      url: "",
      command: "",
      args: "",
      description: "",
      headers: [],
      env: [],
    });
    setAddMCPServerOpen(false);
  };

  const handleDeleteMCPServer = async (serverId: string) => {
    if (!confirm(t("ai.confirm_delete_server"))) return;
    
    await closeMCPClient(serverId);
    clearMCPConnectionStatus(serverId);
    deleteMCPServer(serverId);
    setMcpConnectionStates(prev => {
      const next = { ...prev };
      delete next[serverId];
      return next;
    });
    setMcpToolsCounts(prev => {
      const next = { ...prev };
      delete next[serverId];
      return next;
    });
  };

  const getConnectionStatusIcon = (status: MCPConnectionStatus, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    switch (status) {
      case "connected":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "connecting":
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Radio className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const mcpServers = useMemo(() => settings.mcpServers || [], [settings.mcpServers]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Storage Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          <p className="font-medium">
            {storageInfo.mode === "tauri"
              ? t("ai.storage_secure")
              : t("ai.storage_browser")}
          </p>
          <p className="text-xs">{storageInfo.description}</p>
        </AlertDescription>
      </Alert>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            {t("ai.api_keys")}
          </CardTitle>
          <CardDescription>{t("ai.api_keys_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OpenAI */}
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                >
                  {showOpenaiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => handleSaveAPIKey("openai")}
                disabled={isSaving || !openaiKey}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ai.save")}
              </Button>
              {settings.apiKeys?.openai && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAPIKey("openai")}
                >
                  {t("ai.delete")}
                </Button>
              )}
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <Label>Anthropic API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showAnthropicKey ? "text" : "password"}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                >
                  {showAnthropicKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => handleSaveAPIKey("anthropic")}
                disabled={isSaving || !anthropicKey}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ai.save")}
              </Button>
              {settings.apiKeys?.anthropic && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAPIKey("anthropic")}
                >
                  {t("ai.delete")}
                </Button>
              )}
            </div>
          </div>

          {/* Test Connection */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTesting || !settings.apiKeys?.[settings.provider]}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t("ai.test_connection")}
            </Button>

            {testResult && (
              <Alert
                variant={testResult.success ? "default" : "destructive"}
                className="mt-2"
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Custom Providers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="w-4 h-4" />
                {t("ai.custom_providers")}
              </CardTitle>
              <CardDescription>{t("ai.custom_providers_description")}</CardDescription>
            </div>
            <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("ai.add_provider")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("ai.add_custom_provider")}</DialogTitle>
                  <DialogDescription>{t("ai.add_custom_provider_description")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Preset Providers */}
                  <div className="space-y-2">
                    <Label>{t("ai.preset_providers")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_PROVIDERS.map((preset, index) => (
                        <Button
                          key={preset.name}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-start h-auto py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            addPresetProvider(index);
                            setAddProviderOpen(false);
                          }}
                        >
                          <Globe className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  {/* Manual Add */}
                  <div className="space-y-3">
                    <Label>{t("ai.manual_add")}</Label>
                    <Input
                      placeholder={t("ai.provider_name")}
                      value={newProvider.name || ""}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    />
                    <Input
                      placeholder={t("ai.base_url")}
                      value={newProvider.baseURL || ""}
                      onChange={(e) => setNewProvider({ ...newProvider, baseURL: e.target.value })}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">{t("ai.add_model")}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Model ID"
                          value={newModelInput.id}
                          onChange={(e) => setNewModelInput({ ...newModelInput, id: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Name"
                          value={newModelInput.name}
                          onChange={(e) => setNewModelInput({ ...newModelInput, name: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (newModelInput.id && newModelInput.name) {
                              setNewProvider({
                                ...newProvider,
                                models: [
                                  ...(newProvider.models || []),
                                  { ...newModelInput, supportsVision: false },
                                ],
                              });
                              setNewModelInput({ id: "", name: "", contextWindow: 128000 });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {newProvider.models && newProvider.models.length > 0 && (
                      <div className="text-xs space-y-1">
                        {newProvider.models.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-1 bg-muted rounded">
                            <span>{m.name} ({m.id})</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => setNewProvider({
                                ...newProvider,
                                models: newProvider.models?.filter((_, idx) => idx !== i),
                              })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (newProvider.name && newProvider.baseURL && newProvider.models?.length) {
                        addCustomProvider({
                          name: newProvider.name,
                          baseURL: newProvider.baseURL,
                          models: newProvider.models,
                          isEnabled: true,
                        });
                        setNewProvider({ name: "", baseURL: "", models: [] });
                        setAddProviderOpen(false);
                      }
                    }}
                    disabled={!newProvider.name || !newProvider.baseURL || !newProvider.models?.length}
                  >
                    {t("ai.add_provider")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {customProviders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("ai.no_custom_providers")}
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {customProviders.map((provider) => (
                <AccordionItem key={provider.id} value={provider.id}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {provider.name}
                      <span className="text-xs text-muted-foreground">
                        ({provider.models.length} models)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      <Globe className="h-3 w-3 inline mr-1" />
                      {provider.baseURL}
                    </div>
                    {/* API Key for custom provider */}
                    <div className="space-y-2">
                      <Label className="text-xs">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showCustomKeys[provider.id] ? "text" : "password"}
                            value={customProviderKeys[provider.id] || ""}
                            onChange={(e) => setCustomProviderKeys({
                              ...customProviderKeys,
                              [provider.id]: e.target.value,
                            })}
                            placeholder="API Key"
                            className="text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-8"
                            onClick={() => setShowCustomKeys({
                              ...showCustomKeys,
                              [provider.id]: !showCustomKeys[provider.id],
                            })}
                          >
                            {showCustomKeys[provider.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const key = customProviderKeys[provider.id];
                            if (key) {
                              // Store in zustand state (for runtime use)
                              setAPIKey(provider.id, key);
                              // Also save securely (encrypted in browser, keychain in Tauri)
                              await saveAPIKeySecurely(provider.id, key);
                            }
                          }}
                          disabled={!customProviderKeys[provider.id]}
                        >
                          {t("ai.save")}
                        </Button>
                      </div>
                    </div>
                    {/* Models list */}
                    <div className="text-xs space-y-1">
                      <Label className="text-xs">{t("ai.models")}</Label>
                      {provider.models.map((model) => (
                        <div key={model.id} className="p-1.5 bg-muted rounded flex justify-between">
                          <span>{model.name}</span>
                          <span className="text-muted-foreground">{model.contextWindow.toLocaleString()} tokens</span>
                        </div>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          updateSettings({
                            provider: "custom",
                            customProviderId: provider.id,
                            model: provider.models[0]?.id || "",
                          });
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {t("ai.use_provider")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCustomProvider(provider.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* MCP Servers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <PlugZap className="w-4 h-4" />
                {t("ai.mcp_servers")}
              </CardTitle>
              <CardDescription>{t("ai.mcp_servers_description")}</CardDescription>
            </div>
            <Dialog open={addMCPServerOpen} onOpenChange={setAddMCPServerOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("ai.add_mcp_server")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("ai.add_mcp_server")}</DialogTitle>
                  <DialogDescription>{t("ai.mcp_servers_description")}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="presets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets">{t("ai.mcp_presets")}</TabsTrigger>
                    <TabsTrigger value="custom">{t("ai.mcp_custom")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="presets" className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground">
                      {!isStdioMCPAvailable() && t("ai.stdio_requires_tauri")}
                    </p>
                    <div className="grid gap-2">
                      {MCP_SERVER_PRESETS.map((preset, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{preset.name}</span>
                              <Badge variant={preset.type === "stdio" ? "secondary" : "default"} className="text-xs">
                                {preset.type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMCPPreset(index)}
                            disabled={preset.type === "stdio" && !isStdioMCPAvailable()}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("ai.add_provider")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="custom" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>{t("ai.server_name")}</Label>
                        <Input
                          value={newMCPServer.name}
                          onChange={(e) => setNewMCPServer({ ...newMCPServer, name: e.target.value })}
                          placeholder="My MCP Server"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("ai.server_type")}</Label>
                        <Select
                          value={newMCPServer.type}
                          onValueChange={(value: "http" | "sse" | "stdio") => 
                            setNewMCPServer({ ...newMCPServer, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">{t("ai.mcp_type_http")}</SelectItem>
                            <SelectItem value="sse">{t("ai.mcp_type_sse")}</SelectItem>
                            <SelectItem value="stdio" disabled={!isStdioMCPAvailable()}>
                              {t("ai.mcp_type_stdio")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newMCPServer.type !== "stdio" ? (
                        <div className="space-y-2">
                          <Label>{t("ai.server_url")}</Label>
                          <Input
                            value={newMCPServer.url}
                            onChange={(e) => setNewMCPServer({ ...newMCPServer, url: e.target.value })}
                            placeholder="https://mcp-server.example.com"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>{t("ai.server_command")}</Label>
                            <Input
                              value={newMCPServer.command}
                              onChange={(e) => setNewMCPServer({ ...newMCPServer, command: e.target.value })}
                              placeholder="npx"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("ai.server_args")}</Label>
                            <Input
                              value={newMCPServer.args}
                              onChange={(e) => setNewMCPServer({ ...newMCPServer, args: e.target.value })}
                              placeholder="-y @modelcontextprotocol/server-fetch"
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label>{t("ai.server_description")}</Label>
                        <Input
                          value={newMCPServer.description}
                          onChange={(e) => setNewMCPServer({ ...newMCPServer, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      {/* Headers for HTTP/SSE */}
                      {newMCPServer.type !== "stdio" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>{t("ai.server_headers")}</Label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setNewMCPServer({
                                ...newMCPServer,
                                headers: [...newMCPServer.headers, { key: "", value: "" }]
                              })}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t("ai.add_header")}
                            </Button>
                          </div>
                          {newMCPServer.headers.map((header, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                placeholder={t("ai.env_key")}
                                value={header.key}
                                onChange={(e) => {
                                  const headers = [...newMCPServer.headers];
                                  headers[i].key = e.target.value;
                                  setNewMCPServer({ ...newMCPServer, headers });
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder={t("ai.env_value")}
                                value={header.value}
                                onChange={(e) => {
                                  const headers = [...newMCPServer.headers];
                                  headers[i].value = e.target.value;
                                  setNewMCPServer({ ...newMCPServer, headers });
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const headers = newMCPServer.headers.filter((_, idx) => idx !== i);
                                  setNewMCPServer({ ...newMCPServer, headers });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Environment Variables */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{t("ai.server_env")}</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setNewMCPServer({
                              ...newMCPServer,
                              env: [...newMCPServer.env, { key: "", value: "" }]
                            })}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("ai.add_env_var")}
                          </Button>
                        </div>
                        {newMCPServer.env.map((envVar, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              placeholder={t("ai.env_key")}
                              value={envVar.key}
                              onChange={(e) => {
                                const env = [...newMCPServer.env];
                                env[i].key = e.target.value;
                                setNewMCPServer({ ...newMCPServer, env });
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder={t("ai.env_value")}
                              type="password"
                              value={envVar.value}
                              onChange={(e) => {
                                const env = [...newMCPServer.env];
                                env[i].value = e.target.value;
                                setNewMCPServer({ ...newMCPServer, env });
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const env = newMCPServer.env.filter((_, idx) => idx !== i);
                                setNewMCPServer({ ...newMCPServer, env });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddCustomMCPServer}
                        disabled={!newMCPServer.name || (newMCPServer.type !== "stdio" && !newMCPServer.url) || (newMCPServer.type === "stdio" && !newMCPServer.command)}
                      >
                        {t("ai.add_mcp_server")}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MCP Global Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("ai.enable_mcp_tools")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("ai.enable_mcp_tools_description")}
                </p>
              </div>
              <Switch
                checked={settings.enableMCPTools}
                onCheckedChange={(checked) => updateSettings({ enableMCPTools: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("ai.enable_multi_step")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("ai.enable_multi_step_description")}
                </p>
              </div>
              <Switch
                checked={settings.enableMultiStepTools}
                onCheckedChange={(checked) => updateSettings({ enableMultiStepTools: checked })}
              />
            </div>
            {settings.enableMultiStepTools && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("ai.max_tool_steps")}</Label>
                  <span className="text-sm text-muted-foreground">{settings.maxToolSteps}</span>
                </div>
                <Slider
                  value={[settings.maxToolSteps]}
                  onValueChange={([value]) => updateSettings({ maxToolSteps: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* MCP Server List */}
          {mcpServers.length === 0 ? (
            <div className="text-center py-6">
              <Plug className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("ai.no_mcp_servers")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("ai.no_mcp_servers_hint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mcpServers.map((server) => {
                const status = mcpConnectionStates[server.id] || getMCPConnectionStatus(server.id);
                const toolsCount = mcpToolsCounts[server.id] ?? getCachedMCPTools(server.id).length;
                const isTestingThis = testingMCPServer === server.id;
                
                return (
                  <div
                    key={server.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getConnectionStatusIcon(status, isTestingThis)}
                        <span className="font-medium text-sm">{server.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {server.type.toUpperCase()}
                        </Badge>
                      </div>
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={() => toggleMCPServer(server.id)}
                      />
                    </div>
                    {server.description && (
                      <p className="text-xs text-muted-foreground">{server.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {server.url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {server.url}
                        </span>
                      )}
                      {server.command && (
                        <span className="flex items-center gap-1">
                          <Terminal className="h-3 w-3" />
                          {server.command} {server.args?.join(" ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status === "connected" && (
                          <Badge variant="secondary" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            {t("ai.tools_available", { count: toolsCount })}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTestMCPServer(server)}
                                disabled={isTestingThis || !server.enabled}
                              >
                                {isTestingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("ai.test_mcp_connection")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMCPServer(server.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4" />
            {t("ai.model_settings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <Label>{t("ai.provider")}</Label>
            <Select
              value={
                settings.provider === "custom" && settings.customProviderId
                  ? `custom:${settings.customProviderId}`
                  : settings.provider
              }
              onValueChange={(value) => {
                if (value.startsWith("custom:")) {
                  const customId = value.replace("custom:", "");
                  const customProvider = customProviders.find((p) => p.id === customId);
                  updateSettings({
                    provider: "custom",
                    customProviderId: customId,
                    // Auto-select first model of the custom provider
                    model: customProvider?.models[0]?.id || settings.model,
                  });
                } else {
                  updateSettings({
                    provider: value as AIProvider,
                    customProviderId: undefined,
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ai.select_provider")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                {customProviders.filter((p) => p.isEnabled).map((p) => (
                  <SelectItem key={p.id} value={`custom:${p.id}`}>
                    <span className="flex items-center gap-2">
                      <Server className="h-3 w-3" />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>{t("ai.model")}</Label>
            {settings.provider === "custom" && settings.customProviderId ? (
              // Custom provider models
              <Select
                value={settings.model}
                onValueChange={(value) => updateSettings({ model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customProviders
                    .find((p) => p.id === settings.customProviderId)
                    ?.models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              // Built-in provider models
              <ModelSelector>
                <ModelSelectorTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <ModelSelectorLogo provider={settings.provider as BuiltInProvider} />
                      {AI_MODELS.find((m) => m.id === settings.model)?.name || settings.model}
                    </span>
                    <Sparkles className="h-4 w-4 opacity-50" />
                  </Button>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder={t("ai.search_models")} />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>{t("ai.no_models_found")}</ModelSelectorEmpty>
                    <ModelSelectorGroup heading={settings.provider.toUpperCase()}>
                      {AI_MODELS.filter((m) => m.provider === settings.provider).map(
                        (model) => (
                          <ModelSelectorItem
                            key={model.id}
                            value={model.id}
                            onSelect={() => updateSettings({ model: model.id })}
                          >
                            <ModelSelectorLogo provider={model.provider} />
                            <ModelSelectorName>
                              {model.name}
                              {model.supportsVision && (
                                <span className="ml-1 text-xs text-muted-foreground">(Vision)</span>
                              )}
                            </ModelSelectorName>
                            {model.id === settings.model && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </ModelSelectorItem>
                        )
                      )}
                    </ModelSelectorGroup>
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
            )}
            <p className="text-xs text-muted-foreground">
              {t("ai.context_window")}: {(() => {
                if (settings.provider === "custom" && settings.customProviderId) {
                  const customProvider = customProviders.find(p => p.id === settings.customProviderId);
                  const model = customProvider?.models.find(m => m.id === settings.model);
                  return model?.contextWindow || 0;
                }
                return AI_MODELS.find((m) => m.id === settings.model)?.contextWindow || 0;
              })().toLocaleString()} tokens
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("ai.temperature")}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.temperature]}
              onValueChange={([value]) => updateSettings({ temperature: value })}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              {t("ai.temperature_description")}
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("ai.max_tokens")}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.maxTokens}
              </span>
            </div>
            <Slider
              value={[settings.maxTokens]}
              onValueChange={([value]) => updateSettings({ maxTokens: value })}
              min={256}
              max={8192}
              step={256}
            />
          </div>

          {/* Include PDF Context */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("ai.include_pdf_context")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("ai.include_pdf_context_description")}
              </p>
            </div>
            <Switch
              checked={settings.includePDFContext}
              onCheckedChange={(checked) =>
                updateSettings({ includePDFContext: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* System Prompt - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {t("ai.system_prompt")}
          </CardTitle>
          <CardDescription>{t("ai.system_prompt_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Selection */}
          <div className="space-y-2">
            <Label>{t("ai.system_prompt_preset", "Preset")}</Label>
            <Select
              onValueChange={(presetId) => {
                const preset = SYSTEM_PROMPT_PRESETS.find(p => p.id === presetId);
                if (preset) {
                  updateSettings({ systemPrompt: preset.prompt });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ai.select_preset", "Select a preset...")} />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_PROMPT_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex flex-col">
                      <span>{preset.name}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* System Prompt Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("ai.custom_prompt", "Custom Prompt")}</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateSettings({ systemPrompt: SYSTEM_PROMPT_PRESETS[0].prompt })}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("ai.reset_to_default", "Reset")}
              </Button>
            </div>
            <Textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          
          {/* Variable Hints */}
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">{t("ai.available_variables", "Available variables:")} </p>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_VARIABLES.map((v) => (
                <Badge key={v.key} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {v.key}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Commands Management */}
      <QuickCommandsSettings />
      
      {/* Prompt Templates Management */}
      <PromptTemplatesSettings />
    </div>
  );
}

// ============================================================================
// Quick Commands Settings Component
// ============================================================================

const COMMAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Languages,
  Lightbulb,
  List,
  HelpCircle,
  BookOpen,
  Sparkles,
  GitCompare,
  Zap,
};

function QuickCommandsSettings() {
  const { t } = useTranslation();
  const { settings, addQuickCommand, updateQuickCommand, deleteQuickCommand, toggleQuickCommand, resetQuickCommands } = useAIChatStore();
  const [editingCommand, setEditingCommand] = useState<QuickCommand | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCommand, setNewCommand] = useState<Partial<QuickCommand>>({
    name: "",
    description: "",
    prompt: "",
    shortcut: "",
    icon: "Zap",
    category: "custom",
    enabled: true,
  });

  const handleAddCommand = () => {
    if (newCommand.name && newCommand.prompt) {
      addQuickCommand(newCommand as Omit<QuickCommand, 'id'>);
      setNewCommand({
        name: "",
        description: "",
        prompt: "",
        shortcut: "",
        icon: "Zap",
        category: "custom",
        enabled: true,
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdateCommand = () => {
    if (editingCommand) {
      updateQuickCommand(editingCommand.id, editingCommand);
      setEditingCommand(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t("ai.quick_commands.title", "Quick Commands")}
            </CardTitle>
            <CardDescription>{t("ai.quick_commands.description", "Manage slash commands for quick AI actions")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetQuickCommands}>
              <RotateCcw className="h-3 w-3 mr-1" />
              {t("ai.reset", "Reset")}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  {t("ai.add", "Add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("ai.quick_commands.add_new", "Add Quick Command")}</DialogTitle>
                  <DialogDescription>
                    {t("ai.quick_commands.add_description", "Create a custom quick command with a slash shortcut")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("ai.name", "Name")}</Label>
                      <Input
                        value={newCommand.name || ""}
                        onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                        placeholder="Summarize"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ai.shortcut", "Shortcut")}</Label>
                      <Input
                        value={newCommand.shortcut || ""}
                        onChange={(e) => setNewCommand({ ...newCommand, shortcut: e.target.value })}
                        placeholder="/sum"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.description", "Description")}</Label>
                    <Input
                      value={newCommand.description || ""}
                      onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                      placeholder="Summarize the current page"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.prompt_template", "Prompt Template")}</Label>
                    <Textarea
                      value={newCommand.prompt || ""}
                      onChange={(e) => setNewCommand({ ...newCommand, prompt: e.target.value })}
                      rows={4}
                      className="font-mono text-sm"
                      placeholder="Please summarize the following content from page {{page}}:\n\n{{selection}}"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Badge
                          key={v.key}
                          variant="secondary"
                          className="text-[10px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setNewCommand({ ...newCommand, prompt: (newCommand.prompt || "") + v.key })}
                        >
                          {v.key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t("ai.cancel", "Cancel")}
                  </Button>
                  <Button onClick={handleAddCommand} disabled={!newCommand.name || !newCommand.prompt}>
                    {t("ai.add", "Add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {settings.quickCommands.map((cmd) => {
            const Icon = COMMAND_ICONS[cmd.icon || "Zap"] || Zap;
            return (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{cmd.name}</span>
                      {cmd.shortcut && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {cmd.shortcut}
                        </Badge>
                      )}
                      {cmd.category === "builtin" && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {t("ai.builtin", "Built-in")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{cmd.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cmd.enabled}
                    onCheckedChange={() => toggleQuickCommand(cmd.id)}
                  />
                  {cmd.category === "custom" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingCommand(cmd)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteQuickCommand(cmd.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Edit Dialog */}
        <Dialog open={!!editingCommand} onOpenChange={(open) => !open && setEditingCommand(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("ai.quick_commands.edit", "Edit Quick Command")}</DialogTitle>
            </DialogHeader>
            {editingCommand && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ai.name", "Name")}</Label>
                    <Input
                      value={editingCommand.name}
                      onChange={(e) => setEditingCommand({ ...editingCommand, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.shortcut", "Shortcut")}</Label>
                    <Input
                      value={editingCommand.shortcut || ""}
                      onChange={(e) => setEditingCommand({ ...editingCommand, shortcut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ai.description", "Description")}</Label>
                  <Input
                    value={editingCommand.description}
                    onChange={(e) => setEditingCommand({ ...editingCommand, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ai.prompt_template", "Prompt Template")}</Label>
                  <Textarea
                    value={editingCommand.prompt}
                    onChange={(e) => setEditingCommand({ ...editingCommand, prompt: e.target.value })}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCommand(null)}>
                {t("ai.cancel", "Cancel")}
              </Button>
              <Button onClick={handleUpdateCommand}>
                {t("ai.save", "Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Prompt Templates Settings Component
// ============================================================================

function PromptTemplatesSettings() {
  const { t } = useTranslation();
  const { settings, addPromptTemplate, updatePromptTemplate, deletePromptTemplate, resetPromptTemplates } = useAIChatStore();
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    name: "",
    description: "",
    content: "",
    category: "General",
    isBuiltin: false,
  });

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const groups: Record<string, PromptTemplate[]> = {};
    settings.promptTemplates.forEach((tpl) => {
      if (!groups[tpl.category]) {
        groups[tpl.category] = [];
      }
      groups[tpl.category].push(tpl);
    });
    return groups;
  }, [settings.promptTemplates]);

  const handleAddTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      addPromptTemplate(newTemplate as Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>);
      setNewTemplate({
        name: "",
        description: "",
        content: "",
        category: "General",
        isBuiltin: false,
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate) {
      updatePromptTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
    }
  };

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              {t("ai.prompt_templates.title", "Prompt Templates")}
            </CardTitle>
            <CardDescription>{t("ai.prompt_templates.description", "Reusable prompt templates for common tasks")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetPromptTemplates}>
              <RotateCcw className="h-3 w-3 mr-1" />
              {t("ai.reset", "Reset")}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  {t("ai.add", "Add")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("ai.prompt_templates.add_new", "Add Prompt Template")}</DialogTitle>
                  <DialogDescription>
                    {t("ai.prompt_templates.add_description", "Create a reusable prompt template")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("ai.name", "Name")}</Label>
                      <Input
                        value={newTemplate.name || ""}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="My Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ai.category", "Category")}</Label>
                      <Select
                        value={newTemplate.category}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.description", "Description")}</Label>
                    <Input
                      value={newTemplate.description || ""}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="A brief description of what this template does"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.content", "Template Content")}</Label>
                    <Textarea
                      value={newTemplate.content || ""}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="Enter your prompt template here...\n\nUse variables like {{selection}}, {{page}}, {{fileName}}"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Badge
                          key={v.key}
                          variant="secondary"
                          className="text-[10px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setNewTemplate({ ...newTemplate, content: (newTemplate.content || "") + v.key })}
                        >
                          {v.key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t("ai.cancel", "Cancel")}
                  </Button>
                  <Button onClick={handleAddTemplate} disabled={!newTemplate.name || !newTemplate.content}>
                    {t("ai.add", "Add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <span>{category}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {templates.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tpl.name}</span>
                          {tpl.isBuiltin && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {t("ai.builtin", "Built-in")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyTemplate(tpl.content)}
                          title={t("ai.copy", "Copy")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {!tpl.isBuiltin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingTemplate(tpl)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deletePromptTemplate(tpl.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {/* Edit Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("ai.prompt_templates.edit", "Edit Prompt Template")}</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ai.name", "Name")}</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ai.category", "Category")}</Label>
                    <Select
                      value={editingTemplate.category}
                      onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ai.description", "Description")}</Label>
                  <Input
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ai.content", "Template Content")}</Label>
                  <Textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                {t("ai.cancel", "Cancel")}
              </Button>
              <Button onClick={handleUpdateTemplate}>
                {t("ai.save", "Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
