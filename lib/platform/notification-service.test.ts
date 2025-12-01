import { sendSystemNotification } from "./notification-service";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

// Mock the Tauri plugin
jest.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted: jest.fn(),
  requestPermission: jest.fn(),
  sendNotification: jest.fn(),
}));

describe("notification-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send notification if permission is already granted", async () => {
    (isPermissionGranted as jest.Mock).mockResolvedValue(true);

    await sendSystemNotification({
      title: "Test Title",
      body: "Test Body",
    });

    expect(isPermissionGranted).toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledWith({
      title: "Test Title",
      body: "Test Body",
    });
  });

  it("should request permission if not granted, and send if granted", async () => {
    (isPermissionGranted as jest.Mock).mockResolvedValue(false);
    (requestPermission as jest.Mock).mockResolvedValue("granted");

    await sendSystemNotification({
      title: "Test Title",
      body: "Test Body",
    });

    expect(isPermissionGranted).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledWith({
      title: "Test Title",
      body: "Test Body",
    });
  });

  it("should not send notification if permission is denied", async () => {
    (isPermissionGranted as jest.Mock).mockResolvedValue(false);
    (requestPermission as jest.Mock).mockResolvedValue("denied");

    await sendSystemNotification({
      title: "Test Title",
    });

    expect(isPermissionGranted).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    (isPermissionGranted as jest.Mock).mockRejectedValue(
      new Error("Test Error")
    );
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await sendSystemNotification({ title: "Test" });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to send notification:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
