/**
 * Tests for useTTS hook (hooks/use-tts.ts)
 */

import { renderHook, act } from "@testing-library/react";
import { useTTS } from "./use-tts";

// Mock SpeechSynthesis API
const mockSpeak = jest.fn();
const mockCancel = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockGetVoices = jest.fn();

const mockSpeechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  pause: mockPause,
  resume: mockResume,
  getVoices: mockGetVoices,
  onvoiceschanged: null as (() => void) | null,
};

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Setup global mocks
  Object.defineProperty(window, "speechSynthesis", {
    value: mockSpeechSynthesis,
    writable: true,
    configurable: true,
  });

  global.SpeechSynthesisUtterance =
    MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;

  mockGetVoices.mockReturnValue([
    { name: "English Voice", lang: "en-US" },
    { name: "Chinese Voice", lang: "zh-CN" },
  ]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useTTS", () => {
  describe("Initial State", () => {
    it("should detect speech synthesis support", () => {
      const { result } = renderHook(() => useTTS());

      // Need to advance timers for the setTimeout in the hook
      act(() => {
        jest.advanceTimersByTime(10);
      });

      expect(result.current.isSupported).toBe(true);
    });

    it("should not be speaking initially", () => {
      const { result } = renderHook(() => useTTS());

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });

    it("should load available voices", () => {
      const { result } = renderHook(() => useTTS());

      expect(result.current.voices).toHaveLength(2);
      expect(result.current.voices[0].name).toBe("English Voice");
    });
  });

  describe("speak", () => {
    it("should call speechSynthesis.speak", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello world");
      });

      expect(mockCancel).toHaveBeenCalled(); // Cancels any current speech
      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should set speaking state on start", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello");
      });

      // Simulate onstart callback
      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it("should reset state on end", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello");
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      act(() => {
        utterance.onstart?.();
      });

      expect(result.current.isSpeaking).toBe(true);

      act(() => {
        utterance.onend?.();
      });

      expect(result.current.isSpeaking).toBe(false);
    });

    it("should apply options", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      const mockVoice = { name: "Test Voice" } as SpeechSynthesisVoice;

      act(() => {
        result.current.speak("Hello", {
          rate: 1.5,
          pitch: 0.8,
          volume: 0.9,
          voice: mockVoice,
        });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
      expect(utterance.volume).toBe(0.9);
      expect(utterance.voice).toBe(mockVoice);
    });

    it("should call onStart callback", () => {
      const onStart = jest.fn();
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello", { onStart });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onstart?.();
      });

      expect(onStart).toHaveBeenCalled();
    });

    it("should call onEnd callback", () => {
      const onEnd = jest.fn();
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello", { onEnd });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onend?.();
      });

      expect(onEnd).toHaveBeenCalled();
    });

    it("should not speak if not supported", () => {
      // Save original
      const originalSpeechSynthesis = window.speechSynthesis;

      // Remove speechSynthesis
      // @ts-expect-error - intentionally setting to undefined for test
      delete window.speechSynthesis;

      const { result } = renderHook(() => useTTS());

      // isSupported should be false
      expect(result.current.isSupported).toBe(false);

      // Restore
      Object.defineProperty(window, "speechSynthesis", {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true,
      });
    });
  });

  describe("pause", () => {
    it("should call speechSynthesis.pause", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.pause();
      });

      expect(mockPause).toHaveBeenCalled();
      expect(result.current.isPaused).toBe(true);
    });
  });

  describe("resume", () => {
    it("should call speechSynthesis.resume", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(mockResume).toHaveBeenCalled();
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("cancel", () => {
    it("should call speechSynthesis.cancel", () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello");
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onstart?.();
      });

      act(() => {
        result.current.cancel();
      });

      expect(mockCancel).toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors and call onError callback", () => {
      const onError = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello", { onError });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      const mockError = {
        error: "synthesis-failed",
      } as SpeechSynthesisErrorEvent;

      act(() => {
        utterance.onerror?.(mockError);
      });

      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.isSpeaking).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Pause/Resume Callbacks", () => {
    it("should call onPause callback", () => {
      const onPause = jest.fn();
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello", { onPause });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onpause?.();
      });

      expect(onPause).toHaveBeenCalled();
      expect(result.current.isPaused).toBe(true);
    });

    it("should call onResume callback", () => {
      const onResume = jest.fn();
      const { result } = renderHook(() => useTTS());

      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.speak("Hello", { onResume });
      });

      const utterance = mockSpeak.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      act(() => {
        utterance.onresume?.();
      });

      expect(onResume).toHaveBeenCalled();
      expect(result.current.isPaused).toBe(false);
    });
  });
});
