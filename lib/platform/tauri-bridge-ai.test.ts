/**
 * Tests for Tauri AI Bridge functions
 */

import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder/TextDecoder for Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

import {
  saveAPIKeySecurely,
  getAPIKeySecurely,
  deleteAPIKeySecurely,
  hasAPIKeyStored,
  exportConversation,
  proxyAIRequest,
  getAIUsageStats,
  clearAIUsageStats,
  isTauriAIAvailable,
  getStorageRecommendation,
} from "./tauri-bridge-ai";
import { isTauri } from "./tauri-bridge";

// Mock dependencies
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("./tauri-bridge", () => ({
  isTauri: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock Web Crypto API
const mockCryptoKey = {} as CryptoKey;
const mockEncryptedData = new Uint8Array([1, 2, 3, 4, 5]);
const mockDecryptedData = new TextEncoder().encode("test-api-key");

Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      generateKey: jest.fn().mockResolvedValue(mockCryptoKey),
      importKey: jest.fn().mockResolvedValue(mockCryptoKey),
      exportKey: jest.fn().mockResolvedValue({ k: "test-key-data" }),
      encrypt: jest.fn().mockResolvedValue(mockEncryptedData.buffer),
      decrypt: jest.fn().mockResolvedValue(mockDecryptedData.buffer),
    },
    getRandomValues: jest.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock URL API
const mockRevokeObjectURL = jest.fn();
const mockCreateObjectURL = jest.fn(() => "blob:test-url");
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document for download
const mockClick = jest.fn();
const mockAnchor = {
  href: "",
  download: "",
  click: mockClick,
};
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
  if (tagName === "a") {
    return mockAnchor as unknown as HTMLElement;
  }
  return originalCreateElement(tagName);
});

const mockIsTauri = isTauri as jest.MockedFunction<typeof isTauri>;

describe("Tauri AI Bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockIsTauri.mockReturnValue(false);
  });

  describe("Browser Mode (non-Tauri)", () => {
    beforeEach(() => {
      mockIsTauri.mockReturnValue(false);
    });

    describe("saveAPIKeySecurely", () => {
      it("should encrypt and save API key to localStorage", async () => {
        await saveAPIKeySecurely("openai", "sk-test-key");

        expect(localStorageMock.setItem).toHaveBeenCalled();
        // Find the call that saves the API key (not the encryption key)
        const apiKeyCall = localStorageMock.setItem.mock.calls.find(
          (call: string[]) => call[0] === "ai_api_key_openai"
        );
        expect(apiKeyCall).toBeDefined();
        // Value should be encrypted JSON
        expect(apiKeyCall![1]).toContain("{");
      });

      it("should handle custom provider IDs", async () => {
        await saveAPIKeySecurely("custom-provider-123", "custom-key");

        expect(localStorageMock.setItem).toHaveBeenCalled();
        const apiKeyCall = localStorageMock.setItem.mock.calls.find(
          (call: string[]) => call[0] === "ai_api_key_custom-provider-123"
        );
        expect(apiKeyCall).toBeDefined();
      });
    });

    describe("getAPIKeySecurely", () => {
      it("should return null if no key stored", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getAPIKeySecurely("openai");

        expect(result).toBeNull();
      });

      it("should decrypt encrypted key from localStorage", async () => {
        const encryptedValue = JSON.stringify({
          iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          data: [1, 2, 3, 4, 5],
          v: 1,
        });
        localStorageMock.getItem.mockReturnValue(encryptedValue);

        const result = await getAPIKeySecurely("openai");

        expect(result).toBe("test-api-key");
      });

      it("should migrate unencrypted keys", async () => {
        // Simulate old unencrypted key
        localStorageMock.getItem.mockReturnValue("sk-old-unencrypted-key");

        const result = await getAPIKeySecurely("openai");

        // Should return the key and encrypt it for next time
        expect(result).toBe("sk-old-unencrypted-key");
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    describe("deleteAPIKeySecurely", () => {
      it("should remove key from localStorage", async () => {
        await deleteAPIKeySecurely("openai");

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "ai_api_key_openai"
        );
      });
    });

    describe("hasAPIKeyStored", () => {
      it("should return true if key exists", async () => {
        const encryptedValue = JSON.stringify({
          iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          data: [1, 2, 3, 4, 5],
          v: 1,
        });
        localStorageMock.getItem.mockReturnValue(encryptedValue);

        const result = await hasAPIKeyStored("openai");

        expect(result).toBe(true);
      });

      it("should return false if no key exists", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await hasAPIKeyStored("openai");

        expect(result).toBe(false);
      });
    });

    describe("exportConversation", () => {
      it("should download file via browser", async () => {
        const conversationData = JSON.stringify({ messages: [] });

        await exportConversation(conversationData, "chat.json");

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
        expect(mockAnchor.download).toBe("chat.json");
      });
    });

    describe("proxyAIRequest", () => {
      it("should throw error in browser mode", async () => {
        await expect(
          proxyAIRequest("openai", "gpt-4", [{ role: "user", content: "Hi" }])
        ).rejects.toThrow("AI proxy is only available in Tauri desktop mode");
      });
    });

    describe("getAIUsageStats", () => {
      it("should return null in browser mode", async () => {
        const result = await getAIUsageStats();

        expect(result).toBeNull();
      });
    });

    describe("clearAIUsageStats", () => {
      it("should do nothing in browser mode", async () => {
        await expect(clearAIUsageStats()).resolves.toBeUndefined();
      });
    });
  });

  describe("Tauri Mode", () => {
    const { invoke } = jest.requireMock("@tauri-apps/api/core");

    beforeEach(() => {
      mockIsTauri.mockReturnValue(true);
      invoke.mockReset();
    });

    describe("saveAPIKeySecurely", () => {
      it("should invoke Tauri command", async () => {
        invoke.mockResolvedValue(undefined);

        await saveAPIKeySecurely("openai", "sk-test-key");

        expect(invoke).toHaveBeenCalledWith("save_api_key", {
          provider: "openai",
          apiKey: "sk-test-key",
        });
      });

      it("should throw on Tauri error", async () => {
        invoke.mockRejectedValue(new Error("Tauri error"));

        await expect(
          saveAPIKeySecurely("openai", "sk-test-key")
        ).rejects.toThrow("Tauri error");
      });
    });

    describe("getAPIKeySecurely", () => {
      it("should invoke Tauri command and return key", async () => {
        invoke.mockResolvedValue("sk-stored-key");

        const result = await getAPIKeySecurely("openai");

        expect(invoke).toHaveBeenCalledWith("get_api_key", {
          provider: "openai",
        });
        expect(result).toBe("sk-stored-key");
      });

      it("should return null on error", async () => {
        invoke.mockRejectedValue(new Error("Key not found"));

        const result = await getAPIKeySecurely("openai");

        expect(result).toBeNull();
      });
    });

    describe("deleteAPIKeySecurely", () => {
      it("should invoke Tauri command", async () => {
        invoke.mockResolvedValue(undefined);

        await deleteAPIKeySecurely("openai");

        expect(invoke).toHaveBeenCalledWith("delete_api_key", {
          provider: "openai",
        });
      });
    });

    describe("exportConversation", () => {
      it("should invoke Tauri command", async () => {
        invoke.mockResolvedValue(undefined);
        const data = JSON.stringify({ messages: [] });

        await exportConversation(data, "chat.json");

        expect(invoke).toHaveBeenCalledWith("export_conversation", {
          data,
          fileName: "chat.json",
        });
      });
    });

    describe("proxyAIRequest", () => {
      it("should invoke Tauri command and return response", async () => {
        invoke.mockResolvedValue("AI response");

        const result = await proxyAIRequest(
          "openai",
          "gpt-4",
          [{ role: "user", content: "Hello" }],
          "You are helpful"
        );

        expect(invoke).toHaveBeenCalledWith("proxy_ai_request", {
          provider: "openai",
          model: "gpt-4",
          messages: [{ role: "user", content: "Hello" }],
          systemPrompt: "You are helpful",
        });
        expect(result).toBe("AI response");
      });
    });

    describe("getAIUsageStats", () => {
      it("should invoke Tauri command and return stats", async () => {
        const mockStats = {
          totalTokens: 1000,
          totalRequests: 10,
          costEstimate: 0.05,
        };
        invoke.mockResolvedValue(mockStats);

        const result = await getAIUsageStats();

        expect(invoke).toHaveBeenCalledWith("get_ai_usage_stats");
        expect(result).toEqual(mockStats);
      });

      it("should return null on error", async () => {
        invoke.mockRejectedValue(new Error("Stats unavailable"));

        const result = await getAIUsageStats();

        expect(result).toBeNull();
      });
    });

    describe("clearAIUsageStats", () => {
      it("should invoke Tauri command", async () => {
        invoke.mockResolvedValue(undefined);

        await clearAIUsageStats();

        expect(invoke).toHaveBeenCalledWith("clear_ai_usage_stats");
      });
    });
  });

  describe("isTauriAIAvailable", () => {
    it("should return true in Tauri mode", () => {
      mockIsTauri.mockReturnValue(true);

      expect(isTauriAIAvailable()).toBe(true);
    });

    it("should return false in browser mode", () => {
      mockIsTauri.mockReturnValue(false);

      expect(isTauriAIAvailable()).toBe(false);
    });
  });

  describe("getStorageRecommendation", () => {
    it("should recommend Tauri storage in desktop mode", () => {
      mockIsTauri.mockReturnValue(true);

      const result = getStorageRecommendation();

      expect(result.mode).toBe("tauri");
      expect(result.secure).toBe(true);
      expect(result.description).toContain("credential manager");
    });

    it("should recommend browser storage with warning in browser mode", () => {
      mockIsTauri.mockReturnValue(false);

      const result = getStorageRecommendation();

      expect(result.mode).toBe("browser");
      expect(result.secure).toBe(false);
      expect(result.description).toContain("localStorage");
    });
  });
});
