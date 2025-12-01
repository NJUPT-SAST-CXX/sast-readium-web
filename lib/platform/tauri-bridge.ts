import type { InvokeArgs } from "@tauri-apps/api/core";

// Detect whether we are running inside a Tauri desktop runtime.
// This check is safe to run in both browser and Node/SSR environments.
const isTauriRuntime =
  typeof window !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TAURI_INTERNALS__ !== undefined;

let cachedInvoke: (<T>(cmd: string, args?: InvokeArgs) => Promise<T>) | null =
  null;

async function getInvoke() {
  if (!isTauriRuntime) return null;
  if (cachedInvoke) return cachedInvoke;

  const core = await import("@tauri-apps/api/core");
  cachedInvoke = core.invoke;
  return cachedInvoke;
}

async function safeInvoke<T>(
  cmd: string,
  args?: InvokeArgs
): Promise<T | null> {
  try {
    const invoke = await getInvoke();
    if (!invoke) return null;
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error("Failed to invoke Tauri command", cmd, error);
    return null;
  }
}

export interface SystemInfo {
  os: string;
  arch: string;
}

export interface AppRuntimeInfo {
  name: string;
  version: string;
  tauri_version: string;
  debug: boolean;
  exe_path?: string | null;
  current_dir?: string | null;
}

export interface DesktopPreferences {
  themeMode?: "light" | "dark" | "auto";
  enableSplashScreen?: boolean;
  pdfLoadingAnimation?: "spinner" | "pulse" | "bar";
  // Custom theme support
  activeCustomThemeId?: string | null;
}

export interface FileTimes {
  createdAt?: string;
  modifiedAt?: string;
}

export function isTauri() {
  return isTauriRuntime;
}

export async function getSystemInfo(): Promise<SystemInfo | null> {
  return safeInvoke<SystemInfo>("get_system_info");
}

export async function getAppRuntimeInfo(): Promise<AppRuntimeInfo | null> {
  return safeInvoke<AppRuntimeInfo>("get_app_runtime_info");
}

export async function loadDesktopPreferences(): Promise<DesktopPreferences | null> {
  if (!isTauriRuntime) return null;

  try {
    const fs = await import("@tauri-apps/plugin-fs");
    const { BaseDirectory, exists, readTextFile } = fs;

    const fileName = "preferences.json";
    const options = { baseDir: BaseDirectory.AppConfig } as const;

    const hasFile = await exists(fileName, options);
    if (!hasFile) return null;

    const raw = await readTextFile(fileName, options);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DesktopPreferences;
    return parsed;
  } catch (error) {
    console.error("Failed to load desktop preferences", error);
    return null;
  }
}

export async function saveDesktopPreferences(
  prefs: DesktopPreferences
): Promise<boolean> {
  if (!isTauriRuntime) return false;

  try {
    const fs = await import("@tauri-apps/plugin-fs");
    const { BaseDirectory, writeTextFile } = fs;

    const fileName = "preferences.json";
    const options = { baseDir: BaseDirectory.AppConfig } as const;

    const serialized = JSON.stringify(prefs ?? {}, null, 2);
    await writeTextFile(fileName, serialized, options);
    return true;
  } catch (error) {
    console.error("Failed to save desktop preferences", error);
    return false;
  }
}

export async function openPdfFileViaNativeDialog(): Promise<
  File | File[] | null
> {
  if (!isTauriRuntime) return null;

  try {
    const [dialog, fs] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const selection = await dialog.open({
      multiple: true,
      filters: [
        {
          name: "PDF",
          extensions: ["pdf"],
        },
      ],
    });

    if (!selection) return null;

    const paths = Array.isArray(selection) ? selection : [selection];

    const files = await Promise.all(
      paths.map(async (path) => {
        const data = await fs.readFile(path as string);
        const bytes = data as unknown as Uint8Array;
        const buffer = bytes.buffer as ArrayBuffer;
        const blob = new Blob([buffer], { type: "application/pdf" });
        const fileName =
          (path as string).split(/[\\/]/).pop() ?? "document.pdf";

        const file = new File([blob], fileName, { type: "application/pdf" });

        try {
          Object.defineProperty(file, "__nativePath", {
            value: path,
            configurable: true,
          });
        } catch {
          // best effort
        }
        return file;
      })
    );

    if (files.length === 1) return files[0];
    return files;
  } catch (error) {
    console.error("Failed to open PDF via native dialog", error);
    return null;
  }
}

export async function openPdfFolderViaNativeDialog(): Promise<File[] | null> {
  if (!isTauriRuntime) return null;

  try {
    const [dialog, fs] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const selection = await dialog.open({
      multiple: false,
      directory: true,
    });

    if (!selection) return null;

    const rootPath = Array.isArray(selection) ? selection[0] : selection;
    // @ts-expect-error recursive option is not in type definition
    const entries = await fs.readDir(rootPath as string, { recursive: true });

    type FsEntry = {
      path: string;
      name: string;
      children?: FsEntry[];
    };

    const files: File[] = [];
    const rootNormalized = String(rootPath).replace(/\\/g, "/");

    async function walk(list: FsEntry[]) {
      for (const entry of list) {
        if (entry.children && entry.children.length > 0) {
          await walk(entry.children);
        } else {
          const lower = entry.path.toLowerCase();
          if (!lower.endsWith(".pdf")) continue;

          const data = await fs.readFile(entry.path);
          const bytes = data as unknown as Uint8Array;
          const buffer = bytes.buffer as ArrayBuffer;
          const blob = new Blob([buffer], { type: "application/pdf" });

          const fileName =
            entry.name || entry.path.split(/[\\/]/).pop() || "document.pdf";
          const file = new File([blob], fileName, { type: "application/pdf" });

          const fullNormalized = String(entry.path).replace(/\\/g, "/");
          let relativePath = fullNormalized.startsWith(rootNormalized)
            ? fullNormalized.slice(rootNormalized.length)
            : entry.path;
          relativePath = relativePath.replace(/^[/\\]/, "");

          try {
            Object.defineProperty(file, "webkitRelativePath", {
              value: relativePath,
              configurable: true,
            });
          } catch {
            // best effort; ignore if we cannot define the property
          }

          try {
            Object.defineProperty(file, "__nativePath", {
              value: entry.path,
              configurable: true,
            });
          } catch {
            // best effort; ignore if we cannot define the property
          }

          files.push(file);
        }
      }
    }

    await walk(entries as unknown as FsEntry[]);

    return files;
  } catch (error) {
    console.error("Failed to open folder via native dialog", error);
    return null;
  }
}

export async function readPdfFileAtPath(
  path: string,
  fileName?: string
): Promise<File | null> {
  if (!isTauriRuntime) return null;

  try {
    const fs = await import("@tauri-apps/plugin-fs");

    const data = await fs.readFile(path as string);
    const bytes = data as unknown as Uint8Array;
    const buffer = bytes.buffer as ArrayBuffer;
    const blob = new Blob([buffer], { type: "application/pdf" });
    const finalName =
      fileName ?? (path as string).split(/[\\/]/).pop() ?? "document.pdf";

    const file = new File([blob], finalName, { type: "application/pdf" });

    try {
      Object.defineProperty(file, "__nativePath", {
        value: path,
        configurable: true,
      });
    } catch {
      // best effort; ignore if the property cannot be defined
    }

    return file;
  } catch (error) {
    console.error("Failed to read PDF file at path", path, error);
    return null;
  }
}

type TauriFileInfo = {
  createdAt?: Date | string | number;
  modifiedAt?: Date | string | number;
  creationTime?: Date | string | number;
  updatedAt?: Date | string | number;
  birthtime?: Date | string | number;
  ctime?: Date | string | number;
  mtime?: Date | string | number;
};

export async function getFileTimes(path: string): Promise<FileTimes | null> {
  if (!isTauriRuntime) return null;

  try {
    const fs = await import("@tauri-apps/plugin-fs");
    const stats = (await fs.stat(path as string)) as TauriFileInfo | null;
    if (!stats) return null;

    const normalizeDate = (
      value?: Date | string | number
    ): string | undefined => {
      if (value instanceof Date) {
        return Number.isNaN(value.valueOf()) ? undefined : value.toISOString();
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return new Date(value).toISOString();
      }
      if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.valueOf())
          ? undefined
          : parsed.toISOString();
      }
      return undefined;
    };

    const createdAt =
      normalizeDate(stats.createdAt) ||
      normalizeDate(stats.creationTime) ||
      normalizeDate(stats.birthtime) ||
      normalizeDate(stats.ctime);

    const modifiedAt =
      normalizeDate(stats.modifiedAt) ||
      normalizeDate(stats.mtime) ||
      normalizeDate(stats.updatedAt);

    if (!createdAt && !modifiedAt) {
      return null;
    }

    return {
      createdAt,
      modifiedAt,
    };
  } catch (error) {
    console.error("Failed to read file times", path, error);
    return null;
  }
}

export async function revealInFileManager(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const result = await safeInvoke<boolean>("reveal_in_file_manager", { path });
  return result ?? false;
}

export async function renameFile(
  path: string,
  newName: string
): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const trimmed = newName.trim();
  if (!trimmed) return false;

  const result = await safeInvoke<boolean>("rename_file", {
    path,
    new_name: trimmed,
  });
  return result ?? false;
}

export async function deleteFile(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const result = await safeInvoke<boolean>("delete_file", { path });
  return result ?? false;
}

// Custom themes storage for desktop app
export interface CustomThemeData {
  id: string;
  name: string;
  description?: string;
  colors: Record<string, string>;
  radius?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CustomThemesStorage {
  version: 1;
  themes: CustomThemeData[];
}

const CUSTOM_THEMES_FILE = "custom-themes.json";

export async function loadCustomThemes(): Promise<CustomThemesStorage | null> {
  if (!isTauriRuntime) return null;

  try {
    const fs = await import("@tauri-apps/plugin-fs");
    const { BaseDirectory, exists, readTextFile } = fs;

    const options = { baseDir: BaseDirectory.AppConfig } as const;

    const hasFile = await exists(CUSTOM_THEMES_FILE, options);
    if (!hasFile) return null;

    const raw = await readTextFile(CUSTOM_THEMES_FILE, options);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CustomThemesStorage;
    return parsed;
  } catch (error) {
    console.error("Failed to load custom themes", error);
    return null;
  }
}

export async function saveCustomThemes(
  data: CustomThemesStorage
): Promise<boolean> {
  if (!isTauriRuntime) return false;

  try {
    const fs = await import("@tauri-apps/plugin-fs");
    const { BaseDirectory, writeTextFile } = fs;

    const options = { baseDir: BaseDirectory.AppConfig } as const;

    const serialized = JSON.stringify(data, null, 2);
    await writeTextFile(CUSTOM_THEMES_FILE, serialized, options);
    return true;
  } catch (error) {
    console.error("Failed to save custom themes", error);
    return false;
  }
}

export async function exportCustomThemesToFile(
  data: CustomThemesStorage,
  suggestedName?: string
): Promise<boolean> {
  if (!isTauriRuntime) return false;

  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");

    const savePath = await dialog.save({
      defaultPath: suggestedName || `sast-readium-themes-${Date.now()}.json`,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!savePath) return false;

    const serialized = JSON.stringify(data, null, 2);
    await fs.writeTextFile(savePath, serialized);
    return true;
  } catch (error) {
    console.error("Failed to export custom themes", error);
    return false;
  }
}

export async function importCustomThemesFromFile(): Promise<CustomThemesStorage | null> {
  if (!isTauriRuntime) return null;

  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");

    const selection = await dialog.open({
      multiple: false,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!selection) return null;

    const path = Array.isArray(selection) ? selection[0] : selection;
    const raw = await fs.readTextFile(path as string);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as CustomThemesStorage;

    // Validate version
    if (parsed.version !== 1) {
      console.error("Unsupported custom themes version:", parsed.version);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to import custom themes", error);
    return null;
  }
}

// ============================================================================
// Data Export/Import Native Functions
// ============================================================================

/**
 * Result from native export operation
 */
export interface NativeExportResult {
  success: boolean;
  filePath: string | null;
  bytesWritten: number | null;
  error: string | null;
}

/**
 * Result from native import operation
 */
export interface NativeImportResult {
  success: boolean;
  data: string | null;
  filePath: string | null;
  bytesRead: number | null;
  error: string | null;
}

/**
 * File metadata from native filesystem
 */
export interface NativeFileMetadata {
  path: string;
  name: string;
  size: number;
  modifiedAt: number | null;
  createdAt: number | null;
}

/**
 * Get the default export directory (Documents folder)
 */
export async function getDefaultExportDir(): Promise<string | null> {
  if (!isTauriRuntime) return null;
  return safeInvoke<string>("get_default_export_dir");
}

/**
 * Get the app data directory
 */
export async function getAppDataDir(): Promise<string | null> {
  if (!isTauriRuntime) return null;
  return safeInvoke<string>("get_app_data_dir");
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;
  const result = await safeInvoke<boolean>("ensure_directory", { path });
  return result ?? false;
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;
  const result = await safeInvoke<boolean>("file_exists", { path });
  return result ?? false;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  path: string
): Promise<NativeFileMetadata | null> {
  if (!isTauriRuntime) return null;
  return safeInvoke<NativeFileMetadata>("get_file_metadata", { path });
}

/**
 * List files in a directory with optional extension filter
 */
export async function listFilesInDirectory(
  path: string,
  extension?: string
): Promise<NativeFileMetadata[]> {
  if (!isTauriRuntime) return [];
  const result = await safeInvoke<NativeFileMetadata[]>(
    "list_files_in_directory",
    {
      path,
      extension,
    }
  );
  return result ?? [];
}

/**
 * Copy a file to a new location
 */
export async function copyFile(
  source: string,
  destination: string
): Promise<boolean> {
  if (!isTauriRuntime) return false;
  const result = await safeInvoke<boolean>("copy_file", {
    source,
    destination,
  });
  return result ?? false;
}

/**
 * Export data to a file using native file system
 * @param data JSON string to export
 * @param filePath Target file path (if not provided, will need to use dialog first)
 * @param prettyPrint Whether to format JSON with indentation
 */
export async function exportDataToFile(
  data: string,
  filePath: string,
  prettyPrint: boolean = true
): Promise<NativeExportResult> {
  if (!isTauriRuntime) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Not running in Tauri environment",
    };
  }

  const result = await safeInvoke<NativeExportResult>("export_data_to_file", {
    data,
    filePath,
    prettyPrint,
  });

  return (
    result ?? {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Failed to invoke export command",
    }
  );
}

/**
 * Import data from a file using native file system
 * @param filePath Source file path
 */
export async function importDataFromFile(
  filePath: string
): Promise<NativeImportResult> {
  if (!isTauriRuntime) {
    return {
      success: false,
      data: null,
      filePath: null,
      bytesRead: null,
      error: "Not running in Tauri environment",
    };
  }

  const result = await safeInvoke<NativeImportResult>("import_data_from_file", {
    filePath,
  });

  return (
    result ?? {
      success: false,
      data: null,
      filePath: null,
      bytesRead: null,
      error: "Failed to invoke import command",
    }
  );
}

/**
 * Show native save dialog and export data
 * Combines dialog selection with file writing
 */
export async function exportDataWithDialog(
  data: string,
  suggestedFileName: string = "export.json",
  prettyPrint: boolean = true
): Promise<NativeExportResult> {
  if (!isTauriRuntime) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Not running in Tauri environment",
    };
  }

  try {
    const dialog = await import("@tauri-apps/plugin-dialog");

    const savePath = await dialog.save({
      defaultPath: suggestedFileName,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!savePath) {
      return {
        success: false,
        filePath: null,
        bytesWritten: null,
        error: "User cancelled save dialog",
      };
    }

    return exportDataToFile(data, savePath, prettyPrint);
  } catch (error) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: `Dialog error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Show native open dialog and import data
 * Combines dialog selection with file reading
 */
export async function importDataWithDialog(): Promise<NativeImportResult> {
  if (!isTauriRuntime) {
    return {
      success: false,
      data: null,
      filePath: null,
      bytesRead: null,
      error: "Not running in Tauri environment",
    };
  }

  try {
    const dialog = await import("@tauri-apps/plugin-dialog");

    const selection = await dialog.open({
      multiple: false,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!selection) {
      return {
        success: false,
        data: null,
        filePath: null,
        bytesRead: null,
        error: "User cancelled open dialog",
      };
    }

    const filePath = Array.isArray(selection) ? selection[0] : selection;
    return importDataFromFile(filePath as string);
  } catch (error) {
    return {
      success: false,
      data: null,
      filePath: null,
      bytesRead: null,
      error: `Dialog error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get list of recent export files from app data directory
 */
export async function getRecentExportFiles(): Promise<NativeFileMetadata[]> {
  if (!isTauriRuntime) return [];

  const appDataDir = await getAppDataDir();
  if (!appDataDir) return [];

  const exportsDir = `${appDataDir}/exports`;
  await ensureDirectory(exportsDir);

  return listFilesInDirectory(exportsDir, "json");
}

/**
 * Save export to app data directory with auto-generated name
 */
export async function saveExportToAppData(
  data: string,
  prefix: string = "export"
): Promise<NativeExportResult> {
  if (!isTauriRuntime) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Not running in Tauri environment",
    };
  }

  const appDataDir = await getAppDataDir();
  if (!appDataDir) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Could not get app data directory",
    };
  }

  const exportsDir = `${appDataDir}/exports`;
  await ensureDirectory(exportsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `${prefix}-${timestamp}.json`;
  const filePath = `${exportsDir}/${fileName}`;

  return exportDataToFile(data, filePath, true);
}
