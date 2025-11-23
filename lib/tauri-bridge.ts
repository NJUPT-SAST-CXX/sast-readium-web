import type { InvokeArgs } from "@tauri-apps/api/core";

// Detect whether we are running inside a Tauri desktop runtime.
// This check is safe to run in both browser and Node/SSR environments.
const isTauriRuntime =
  typeof window !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TAURI_INTERNALS__ !== undefined;

let cachedInvoke: (<T>(cmd: string, args?: InvokeArgs) => Promise<T>) | null = null;

async function getInvoke() {
  if (!isTauriRuntime) return null;
  if (cachedInvoke) return cachedInvoke;

  const core = await import("@tauri-apps/api/core");
  cachedInvoke = core.invoke;
  return cachedInvoke;
}

async function safeInvoke<T>(cmd: string, args?: InvokeArgs): Promise<T | null> {
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

export async function saveDesktopPreferences(prefs: DesktopPreferences): Promise<boolean> {
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

export async function openPdfFileViaNativeDialog(): Promise<File | File[] | null> {
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

    const files = await Promise.all(paths.map(async (path) => {
      const data = await fs.readFile(path as string);
      const bytes = data as unknown as Uint8Array;
      const buffer = bytes.buffer as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      const fileName = (path as string).split(/[\\/]/).pop() ?? "document.pdf";

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
    }));

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

          const fileName = entry.name || entry.path.split(/[\\/]/).pop() || "document.pdf";
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

export async function readPdfFileAtPath(path: string, fileName?: string): Promise<File | null> {
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
      // best effort; ignore if we cannot define the property
    }

    return file;
  } catch (error) {
    console.error("Failed to read PDF file at path", path, error);
    return null;
  }
}

export async function revealInFileManager(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const result = await safeInvoke<boolean>("reveal_in_file_manager", { path });
  return result ?? false;
}

export async function renameFile(path: string, newName: string): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const trimmed = newName.trim();
  if (!trimmed) return false;

  const result = await safeInvoke<boolean>("rename_file", { path, new_name: trimmed });
  return result ?? false;
}

export async function deleteFile(path: string): Promise<boolean> {
  if (!isTauriRuntime) return false;

  const result = await safeInvoke<boolean>("delete_file", { path });
  return result ?? false;
}
