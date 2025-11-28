import { useState, useEffect, useRef, useCallback } from "react";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStart?: () => void;
}

export function useTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper to clean up utterance event handlers
  const cleanupUtterance = useCallback(() => {
    if (utteranceRef.current) {
      // Remove all event handlers to prevent memory leaks
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
      utteranceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Small timeout to ensure we are not blocking main thread and let React handle render cycle
      setTimeout(() => setIsSupported(true), 0);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();

      // Store reference to cleanup on unmount
      const synth = window.speechSynthesis;
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }

      // Cleanup on unmount
      return () => {
        // Cancel any ongoing speech
        synth.cancel();
        // Remove voices changed handler
        if (synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const speak = useCallback(
    (text: string, options: TTSOptions = {}) => {
      if (!isSupported) return;

      // Clean up previous utterance handlers before canceling
      cleanupUtterance();

      // Cancel any current speaking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (options.rate) utterance.rate = options.rate;
      if (options.pitch) utterance.pitch = options.pitch;
      if (options.volume) utterance.volume = options.volume;
      if (options.voice) utterance.voice = options.voice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        options.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        cleanupUtterance();
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        setIsSpeaking(false);
        setIsPaused(false);
        cleanupUtterance();
        options.onError?.(e);
      };

      utterance.onpause = () => {
        setIsPaused(true);
        options.onPause?.();
      };

      utterance.onresume = () => {
        setIsPaused(false);
        options.onResume?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, cleanupUtterance]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    cleanupUtterance();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported, cleanupUtterance]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    speak,
    pause,
    resume,
    cancel,
  };
}
