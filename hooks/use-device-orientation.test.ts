/**
 * Tests for useDeviceOrientation hook (hooks/use-device-orientation.ts)
 */

import { renderHook, act } from "@testing-library/react";
import { useDeviceOrientation } from "./use-device-orientation";

// Mock window properties
const mockMatchMedia = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Default to desktop portrait
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 800,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: 1200,
  });

  mockMatchMedia.mockReturnValue({
    matches: false, // Not mobile
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  window.matchMedia = mockMatchMedia;
});

describe("useDeviceOrientation", () => {
  describe("Initial State", () => {
    it("should return portrait orientation for tall viewport", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.orientation).toBe("portrait");
      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });

    it("should return landscape orientation for wide viewport", () => {
      Object.defineProperty(window, "innerWidth", { value: 1200 });
      Object.defineProperty(window, "innerHeight", { value: 800 });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.orientation).toBe("landscape");
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.isPortrait).toBe(false);
    });

    it("should detect mobile device", () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // Mobile
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isMobile).toBe(true);
    });

    it("should detect desktop device", () => {
      mockMatchMedia.mockReturnValue({
        matches: false, // Desktop
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isMobile).toBe(false);
    });

    it("should return viewport dimensions", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });
      Object.defineProperty(window, "innerHeight", { value: 768 });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.viewportWidth).toBe(1024);
      expect(result.current.viewportHeight).toBe(768);
    });
  });

  describe("Mobile Orientation States", () => {
    it("should detect mobile landscape", () => {
      Object.defineProperty(window, "innerWidth", { value: 800 });
      Object.defineProperty(window, "innerHeight", { value: 400 });
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isMobileLandscape).toBe(true);
      expect(result.current.isMobilePortrait).toBe(false);
    });

    it("should detect mobile portrait", () => {
      Object.defineProperty(window, "innerWidth", { value: 400 });
      Object.defineProperty(window, "innerHeight", { value: 800 });
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isMobilePortrait).toBe(true);
      expect(result.current.isMobileLandscape).toBe(false);
    });
  });

  describe("Event Listeners", () => {
    it("should update on resize", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isPortrait).toBe(true);

      // Simulate resize to landscape
      act(() => {
        Object.defineProperty(window, "innerWidth", { value: 1200 });
        Object.defineProperty(window, "innerHeight", { value: 800 });
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.isLandscape).toBe(true);
    });

    it("should update on orientationchange", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.isPortrait).toBe(true);

      // Simulate orientation change
      act(() => {
        Object.defineProperty(window, "innerWidth", { value: 1200 });
        Object.defineProperty(window, "innerHeight", { value: 800 });
        window.dispatchEvent(new Event("orientationchange"));
      });

      expect(result.current.isLandscape).toBe(true);
    });

    it("should cleanup event listeners on unmount", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useDeviceOrientation());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "orientationchange",
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "orientationchange",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
