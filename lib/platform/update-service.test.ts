import { checkForAppUpdates, installAppUpdate } from "./update-service";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

jest.mock("@tauri-apps/plugin-updater", () => ({
  check: jest.fn(),
}));

jest.mock("@tauri-apps/plugin-process", () => ({
  relaunch: jest.fn(),
}));

describe("update-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkForAppUpdates", () => {
    it("should return update available if check returns available update", async () => {
      (check as jest.Mock).mockResolvedValue({
        available: true,
        version: "1.0.1",
        body: "New features",
      });

      const result = await checkForAppUpdates();

      expect(result).toEqual({
        available: true,
        version: "1.0.1",
        body: "New features",
      });
    });

    it("should return available: false if no update", async () => {
      (check as jest.Mock).mockResolvedValue({
        available: false,
      });

      const result = await checkForAppUpdates();

      expect(result).toEqual({ available: false });
    });

    it("should return error if check fails", async () => {
      (check as jest.Mock).mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await checkForAppUpdates();

      expect(result).toEqual({
        available: false,
        error: "Network error",
      });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("installAppUpdate", () => {
    it("should download and install update if available", async () => {
      const mockDownloadAndInstall = jest.fn().mockResolvedValue(undefined);
      (check as jest.Mock).mockResolvedValue({
        available: true,
        downloadAndInstall: mockDownloadAndInstall,
      });

      await installAppUpdate();

      expect(check).toHaveBeenCalled();
      expect(mockDownloadAndInstall).toHaveBeenCalled();
      expect(relaunch).toHaveBeenCalled();
    });

    it("should do nothing if no update available", async () => {
      (check as jest.Mock).mockResolvedValue({
        available: false,
      });

      await installAppUpdate();

      expect(check).toHaveBeenCalled();
      expect(relaunch).not.toHaveBeenCalled();
    });

    it("should throw error if installation fails", async () => {
      const mockDownloadAndInstall = jest
        .fn()
        .mockRejectedValue(new Error("Install failed"));
      (check as jest.Mock).mockResolvedValue({
        available: true,
        downloadAndInstall: mockDownloadAndInstall,
      });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(installAppUpdate()).rejects.toThrow("Install failed");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
