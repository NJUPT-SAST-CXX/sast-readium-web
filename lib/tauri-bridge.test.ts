// We need to mock the global window object before importing the module
Object.defineProperty(window, "__TAURI_INTERNALS__", {
  value: {},
  writable: true,
});

// Mock Tauri APIs
const mockInvoke = jest.fn();
jest.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

const mockExists = jest.fn();
const mockReadTextFile = jest.fn();
const mockWriteTextFile = jest.fn();
const mockReadFile = jest.fn();
const mockReadDir = jest.fn();
jest.mock("@tauri-apps/plugin-fs", () => ({
  BaseDirectory: { AppConfig: "AppConfig" },
  exists: mockExists,
  readTextFile: mockReadTextFile,
  writeTextFile: mockWriteTextFile,
  readFile: mockReadFile,
  readDir: mockReadDir,
}));

const mockOpen = jest.fn();
jest.mock("@tauri-apps/plugin-dialog", () => ({
  open: mockOpen,
}));

// Import the module after mocking
import * as TauriBridge from "./tauri-bridge";

describe("tauri-bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isTauri", () => {
    it("should return true when __TAURI_INTERNALS__ is present", () => {
      expect(TauriBridge.isTauri()).toBe(true);
    });
  });

  describe("getSystemInfo", () => {
    it("should invoke get_system_info", async () => {
      const mockInfo = { os: "Windows", arch: "x86_64" };
      mockInvoke.mockResolvedValue(mockInfo);

      const result = await TauriBridge.getSystemInfo();
      expect(mockInvoke).toHaveBeenCalledWith("get_system_info", undefined);
      expect(result).toEqual(mockInfo);
    });
  });

  describe("getAppRuntimeInfo", () => {
    it("should invoke get_app_runtime_info", async () => {
      const mockInfo = {
        name: "App",
        version: "1.0",
        tauri_version: "1.0",
        debug: true,
      };
      mockInvoke.mockResolvedValue(mockInfo);

      const result = await TauriBridge.getAppRuntimeInfo();
      expect(mockInvoke).toHaveBeenCalledWith(
        "get_app_runtime_info",
        undefined
      );
      expect(result).toEqual(mockInfo);
    });
  });

  describe("DesktopPreferences", () => {
    it("loadDesktopPreferences should return parsed preferences if file exists", async () => {
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue('{"themeMode": "dark"}');

      const prefs = await TauriBridge.loadDesktopPreferences();
      expect(mockExists).toHaveBeenCalledWith(
        "preferences.json",
        expect.any(Object)
      );
      expect(prefs).toEqual({ themeMode: "dark" });
    });

    it("loadDesktopPreferences should return null if file does not exist", async () => {
      mockExists.mockResolvedValue(false);
      const prefs = await TauriBridge.loadDesktopPreferences();
      expect(prefs).toBeNull();
    });

    it("saveDesktopPreferences should write to file", async () => {
      const prefs = { themeMode: "light" as const };
      await TauriBridge.saveDesktopPreferences(prefs);
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        "preferences.json",
        JSON.stringify(prefs, null, 2),
        expect.any(Object)
      );
    });
  });

  describe("File Operations", () => {
    it("openPdfFileViaNativeDialog should return File object", async () => {
      mockOpen.mockResolvedValue("path/to/test.pdf");
      mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const file = await TauriBridge.openPdfFileViaNativeDialog();
      expect(mockOpen).toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalledWith("path/to/test.pdf");
      expect(file).toBeInstanceOf(File);
      if (file && !Array.isArray(file)) {
        expect(file.name).toBe("test.pdf");
      }
    });

    it("readPdfFileAtPath should return File object", async () => {
      mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
      const file = await TauriBridge.readPdfFileAtPath("path/to/test.pdf");
      expect(mockReadFile).toHaveBeenCalledWith("path/to/test.pdf");
      expect(file).toBeInstanceOf(File);
      expect(file?.name).toBe("test.pdf");
    });

    it("openPdfFolderViaNativeDialog should return files from folder", async () => {
      mockOpen.mockResolvedValue("path/to/folder");
      mockReadDir.mockResolvedValue([
        { path: "path/to/folder/doc1.pdf", name: "doc1.pdf", children: [] },
      ]);
      mockReadFile.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const files = await TauriBridge.openPdfFolderViaNativeDialog();
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ directory: true })
      );
      expect(files).toHaveLength(1);
      expect(files?.[0].name).toBe("doc1.pdf");
    });

    it("revealInFileManager should invoke command", async () => {
      mockInvoke.mockResolvedValue(true);
      await TauriBridge.revealInFileManager("path/to/file");
      expect(mockInvoke).toHaveBeenCalledWith("reveal_in_file_manager", {
        path: "path/to/file",
      });
    });

    it("renameFile should invoke command", async () => {
      mockInvoke.mockResolvedValue(true);
      await TauriBridge.renameFile("old/path", "new/name");
      expect(mockInvoke).toHaveBeenCalledWith("rename_file", {
        path: "old/path",
        new_name: "new/name",
      });
    });

    it("deleteFile should invoke command", async () => {
      mockInvoke.mockResolvedValue(true);
      await TauriBridge.deleteFile("path/to/delete");
      expect(mockInvoke).toHaveBeenCalledWith("delete_file", {
        path: "path/to/delete",
      });
    });
  });
});
