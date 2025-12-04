/**
 * Platform Module - Tauri desktop and platform-specific functionality
 *
 * This module provides:
 * - Tauri bridge for desktop features
 * - Secure API key storage
 * - System notifications
 * - Auto-update service
 */

// Core Tauri bridge
export {
  isTauri,
  getSystemInfo,
  getAppRuntimeInfo,
  loadDesktopPreferences,
  saveDesktopPreferences,
  openPdfFileViaNativeDialog,
  openPdfFolderViaNativeDialog,
  readPdfFileAtPath,
  getFileTimes,
  revealInFileManager,
  renameFile,
  deleteFile,
  loadCustomThemes,
  saveCustomThemes,
  exportCustomThemesToFile,
  importCustomThemesFromFile,
  // Data export/import native functions
  getDefaultExportDir,
  getAppDataDir,
  ensureDirectory,
  fileExists,
  getFileMetadata,
  listFilesInDirectory,
  copyFile,
  exportDataToFile,
  importDataFromFile,
  exportDataWithDialog,
  importDataWithDialog,
  getRecentExportFiles,
  saveExportToAppData,
  type SystemInfo,
  type AppRuntimeInfo,
  type DesktopPreferences,
  type FileTimes,
  type CustomThemeData,
  type CustomThemesStorage,
  type NativeExportResult,
  type NativeImportResult,
  type NativeFileMetadata,
} from "./tauri-bridge";

// AI-specific Tauri features (secure storage)
export {
  saveAPIKeySecurely,
  getAPIKeySecurely,
  deleteAPIKeySecurely,
  hasAPIKeyStored,
  exportConversation,
  proxyAIRequest,
  getAIUsageStats,
  updateAIUsageStats,
  clearAIUsageStats,
  isTauriAIAvailable,
  getStorageRecommendation,
  // MCP server management
  startMCPServer,
  stopMCPServer,
  getMCPServerStatuses,
  sendMCPMessage,
  getMCPServerPresets,
  isNativeMCPAvailable,
  // MCP configuration persistence and import/export
  getSavedMCPServers,
  saveMCPServers,
  addMCPServerToStorage,
  updateMCPServerInStorage,
  deleteMCPServerFromStorage,
  importMCPServers,
  importMCPServersFromFile,
  exportMCPServers,
  exportMCPServersToFile,
  exportMCPServersClaudeFormat,
  detectExternalMCPConfigs,
  type SecureStorageItem,
  type AIUsageStats,
  type TauriMCPServerConfig,
  type MCPServerStatus,
  type MCPImportResult,
  type MCPExportResult,
  type MCPConfigSource,
} from "./tauri-bridge-ai";

// Update service
export {
  checkForAppUpdates,
  installAppUpdate,
  type UpdateStatus,
} from "./update-service";

// Notification service
export {
  sendSystemNotification,
  type NotificationOptions,
} from "./notification-service";
