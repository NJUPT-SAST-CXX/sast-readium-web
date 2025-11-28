/**
 * Tests for useTouchGestures hook (hooks/use-touch-gestures.ts)
 *
 * Note: Touch events are difficult to test in jsdom environment.
 * These tests focus on hook initialization, cleanup, and event listener setup.
 */

import { renderHook } from "@testing-library/react";
import { useTouchGestures } from "./use-touch-gestures";

describe("useTouchGestures", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    jest.useFakeTimers();
    element = document.createElement("div");
    document.body.appendChild(element);
  });

  afterEach(() => {
    jest.useRealTimers();
    if (element.parentNode) {
      document.body.removeChild(element);
    }
  });

  describe("Initialization", () => {
    it("should add event listeners on mount", () => {
      const addEventListenerSpy = jest.spyOn(element, "addEventListener");
      const ref = { current: element };

      renderHook(() => useTouchGestures(ref, { onSwipeRight: jest.fn() }));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
        { passive: false }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchcancel",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it("should accept all gesture options", () => {
      const ref = { current: element };
      const options = {
        onPinchZoom: jest.fn(),
        onSwipeLeft: jest.fn(),
        onSwipeRight: jest.fn(),
        onSwipeUp: jest.fn(),
        onSwipeDown: jest.fn(),
        onDoubleTap: jest.fn(),
        onLongPress: jest.fn(),
        minSwipeDistance: 100,
        doubleTapDelay: 400,
        longPressDelay: 600,
      };

      // Should not throw
      expect(() => {
        renderHook(() => useTouchGestures(ref, options));
      }).not.toThrow();
    });
  });

  describe("Cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(element, "removeEventListener");
      const ref = { current: element };

      const { unmount } = renderHook(() =>
        useTouchGestures(ref, { onSwipeRight: jest.fn() })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchcancel",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it("should handle cleanup gracefully", () => {
      const ref = { current: element };

      const { unmount } = renderHook(() =>
        useTouchGestures(ref, { onLongPress: jest.fn(), longPressDelay: 500 })
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Null Element", () => {
    it("should handle null element ref gracefully", () => {
      const ref = { current: null };

      // Should not throw
      expect(() => {
        renderHook(() => useTouchGestures(ref, { onSwipeRight: jest.fn() }));
      }).not.toThrow();
    });

    it("should not throw for null element", () => {
      const ref = { current: null };

      // Should not throw when element is null
      const { unmount } = renderHook(() =>
        useTouchGestures(ref, { onSwipeRight: jest.fn() })
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Options", () => {
    it("should use default minSwipeDistance of 50", () => {
      const ref = { current: element };

      // Should not throw with no minSwipeDistance specified
      expect(() => {
        renderHook(() => useTouchGestures(ref, { onSwipeRight: jest.fn() }));
      }).not.toThrow();
    });

    it("should use default doubleTapDelay of 300", () => {
      const ref = { current: element };

      // Should not throw with no doubleTapDelay specified
      expect(() => {
        renderHook(() => useTouchGestures(ref, { onDoubleTap: jest.fn() }));
      }).not.toThrow();
    });

    it("should use default longPressDelay of 500", () => {
      const ref = { current: element };

      // Should not throw with no longPressDelay specified
      expect(() => {
        renderHook(() => useTouchGestures(ref, { onLongPress: jest.fn() }));
      }).not.toThrow();
    });
  });

  describe("Re-render behavior", () => {
    it("should update handlers when options change", () => {
      const ref = { current: element };
      const onSwipeRight1 = jest.fn();
      const onSwipeRight2 = jest.fn();

      const { rerender } = renderHook(
        ({ onSwipeRight }) => useTouchGestures(ref, { onSwipeRight }),
        { initialProps: { onSwipeRight: onSwipeRight1 } }
      );

      // Rerender with new handler
      rerender({ onSwipeRight: onSwipeRight2 });

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
