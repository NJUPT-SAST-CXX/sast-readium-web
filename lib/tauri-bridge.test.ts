// Mock Tauri APIs - these tests verify the module structure
// Since isTauriRuntime is cached at module load time and we can't easily
// simulate a Tauri environment in Jest, we test the exported interface

import * as TauriBridge from "./tauri-bridge";

describe("tauri-bridge", () => {
  describe("isTauri", () => {
    it("should return false in test environment", () => {
      // In Jest/jsdom, __TAURI_INTERNALS__ is not present
      expect(TauriBridge.isTauri()).toBe(false);
    });
  });

  describe("exported functions", () => {
    it("should export getSystemInfo function", () => {
      expect(typeof TauriBridge.getSystemInfo).toBe("function");
    });

    it("should export getAppRuntimeInfo function", () => {
      expect(typeof TauriBridge.getAppRuntimeInfo).toBe("function");
    });

    it("should export loadDesktopPreferences function", () => {
      expect(typeof TauriBridge.loadDesktopPreferences).toBe("function");
    });

    it("should export saveDesktopPreferences function", () => {
      expect(typeof TauriBridge.saveDesktopPreferences).toBe("function");
    });

    it("should export openPdfFileViaNativeDialog function", () => {
      expect(typeof TauriBridge.openPdfFileViaNativeDialog).toBe("function");
    });

    it("should export readPdfFileAtPath function", () => {
      expect(typeof TauriBridge.readPdfFileAtPath).toBe("function");
    });

    it("should export revealInFileManager function", () => {
      expect(typeof TauriBridge.revealInFileManager).toBe("function");
    });
  });

  describe("non-Tauri environment behavior", () => {
    it("getSystemInfo should return null when not in Tauri", async () => {
      const result = await TauriBridge.getSystemInfo();
      expect(result).toBeNull();
    });

    it("getAppRuntimeInfo should return null when not in Tauri", async () => {
      const result = await TauriBridge.getAppRuntimeInfo();
      expect(result).toBeNull();
    });

    it("loadDesktopPreferences should return null when not in Tauri", async () => {
      const result = await TauriBridge.loadDesktopPreferences();
      expect(result).toBeNull();
    });

    it("openPdfFileViaNativeDialog should return null when not in Tauri", async () => {
      const result = await TauriBridge.openPdfFileViaNativeDialog();
      expect(result).toBeNull();
    });

    it("readPdfFileAtPath should return null when not in Tauri", async () => {
      const result = await TauriBridge.readPdfFileAtPath("/some/path.pdf");
      expect(result).toBeNull();
    });
  });
});
