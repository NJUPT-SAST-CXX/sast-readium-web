/**
 * Custom hooks for AI media features
 * - Image generation
 * - Speech synthesis (Text-to-Speech)
 * - Audio transcription (Speech-to-Text)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useAIChatStore } from "@/lib/ai/core";
import {
  generateImage,
  generateSpeech,
  transcribeAudio,
  createAudioBlobUrl,
  readAudioFile,
  isValidAudioFile,
  type ImageGenerationResult,
  type SpeechGenerationResult,
  type TranscriptionResult,
} from "@/lib/ai/core";
import type { ImageSize, ImageQuality, SpeechVoice } from "@/lib/ai/core";

// ============================================================================
// Image Generation Hook
// ============================================================================

export interface UseImageGenerationOptions {
  onSuccess?: (result: ImageGenerationResult) => void;
  onError?: (error: Error) => void;
}

export interface UseImageGenerationReturn {
  generate: (
    prompt: string,
    options?: {
      size?: ImageSize;
      quality?: ImageQuality;
      style?: "vivid" | "natural";
      n?: number;
    }
  ) => Promise<ImageGenerationResult | null>;
  isGenerating: boolean;
  error: string | null;
  result: ImageGenerationResult | null;
  clearResult: () => void;
  clearError: () => void;
}

export function useImageGeneration(
  options: UseImageGenerationOptions = {}
): UseImageGenerationReturn {
  const { onSuccess, onError } = options;
  const { settings } = useAIChatStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      prompt: string,
      opts?: {
        size?: ImageSize;
        quality?: ImageQuality;
        style?: "vivid" | "natural";
        n?: number;
      }
    ): Promise<ImageGenerationResult | null> => {
      if (!prompt.trim()) {
        setError("Prompt cannot be empty");
        return null;
      }

      const apiKey = settings.apiKeys[settings.provider];
      if (!apiKey) {
        setError(
          `Please configure your ${settings.provider.toUpperCase()} API key`
        );
        return null;
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);
      setError(null);

      try {
        const imageResult = await generateImage(
          {
            provider: settings.provider,
            apiKey,
            model: settings.imageSettings.model,
          },
          {
            prompt,
            size: opts?.size || settings.imageSettings.size,
            quality: opts?.quality || settings.imageSettings.quality,
            style: opts?.style || settings.imageSettings.style,
            n: opts?.n || 1,
            abortSignal: abortControllerRef.current.signal,
          }
        );

        setResult(imageResult);
        onSuccess?.(imageResult);
        return imageResult;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Image generation failed";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [settings, onSuccess, onError]
  );

  const clearResult = useCallback(() => setResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    generate,
    isGenerating,
    error,
    result,
    clearResult,
    clearError,
  };
}

// ============================================================================
// Speech Synthesis Hook (Text-to-Speech)
// ============================================================================

export interface UseSpeechSynthesisOptions {
  onSuccess?: (result: SpeechGenerationResult) => void;
  onError?: (error: Error) => void;
}

export interface UseSpeechSynthesisReturn {
  synthesize: (
    text: string,
    options?: {
      voice?: SpeechVoice;
      speed?: number;
    }
  ) => Promise<SpeechGenerationResult | null>;
  isSynthesizing: boolean;
  error: string | null;
  result: SpeechGenerationResult | null;
  audioUrl: string | null;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  clearResult: () => void;
  clearError: () => void;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { onSuccess, onError } = options;
  const { settings } = useAIChatStore();

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeechGenerationResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const synthesize = useCallback(
    async (
      text: string,
      opts?: {
        voice?: SpeechVoice;
        speed?: number;
      }
    ): Promise<SpeechGenerationResult | null> => {
      if (!text.trim()) {
        setError("Text cannot be empty");
        return null;
      }

      const apiKey = settings.apiKeys[settings.provider];
      if (!apiKey) {
        setError(
          `Please configure your ${settings.provider.toUpperCase()} API key`
        );
        return null;
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Clean up previous audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsSynthesizing(true);
      setError(null);

      try {
        const speechResult = await generateSpeech(
          {
            provider: settings.provider,
            apiKey,
            model: settings.speechSettings.model,
          },
          {
            text,
            voice: opts?.voice || settings.speechSettings.voice,
            speed: opts?.speed || settings.speechSettings.speed,
            abortSignal: abortControllerRef.current.signal,
          }
        );

        setResult(speechResult);

        // Create audio URL
        const url = createAudioBlobUrl(
          speechResult.audio,
          speechResult.mimeType
        );
        setAudioUrl(url);

        // Create audio element
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        audioRef.current = audio;

        onSuccess?.(speechResult);
        return speechResult;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Speech synthesis failed";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      } finally {
        setIsSynthesizing(false);
      }
    },
    [settings, audioUrl, onSuccess, onError]
  );

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setResult(null);
    setAudioUrl(null);
    setIsPlaying(false);
  }, [audioUrl]);

  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  return {
    synthesize,
    isSynthesizing,
    error,
    result,
    audioUrl,
    isPlaying,
    play,
    pause,
    stop,
    clearResult,
    clearError,
  };
}

// ============================================================================
// Audio Transcription Hook (Speech-to-Text)
// ============================================================================

export interface UseTranscriptionOptions {
  onSuccess?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
}

export interface UseTranscriptionReturn {
  transcribe: (
    file: File,
    options?: {
      language?: string;
      prompt?: string;
    }
  ) => Promise<TranscriptionResult | null>;
  transcribeFromUrl: (
    url: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ) => Promise<TranscriptionResult | null>;
  isTranscribing: boolean;
  error: string | null;
  result: TranscriptionResult | null;
  clearResult: () => void;
  clearError: () => void;
  isValidFile: (file: File) => boolean;
}

export function useTranscription(
  options: UseTranscriptionOptions = {}
): UseTranscriptionReturn {
  const { onSuccess, onError } = options;
  const { settings } = useAIChatStore();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const transcribe = useCallback(
    async (
      file: File,
      opts?: {
        language?: string;
        prompt?: string;
      }
    ): Promise<TranscriptionResult | null> => {
      if (!isValidAudioFile(file)) {
        setError(
          "Invalid audio file format. Supported formats: mp3, mp4, m4a, wav, webm, ogg, flac"
        );
        return null;
      }

      const apiKey = settings.apiKeys[settings.provider];
      if (!apiKey) {
        setError(
          `Please configure your ${settings.provider.toUpperCase()} API key`
        );
        return null;
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsTranscribing(true);
      setError(null);

      try {
        const audioData = await readAudioFile(file);

        const transcriptionResult = await transcribeAudio(
          {
            provider: settings.provider,
            apiKey,
            model: settings.transcriptionSettings.model,
          },
          {
            audio: audioData,
            language: opts?.language || settings.transcriptionSettings.language,
            prompt: opts?.prompt,
            abortSignal: abortControllerRef.current.signal,
          }
        );

        setResult(transcriptionResult);
        onSuccess?.(transcriptionResult);
        return transcriptionResult;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [settings, onSuccess, onError]
  );

  const transcribeFromUrl = useCallback(
    async (
      url: string,
      opts?: {
        language?: string;
        prompt?: string;
      }
    ): Promise<TranscriptionResult | null> => {
      const apiKey = settings.apiKeys[settings.provider];
      if (!apiKey) {
        setError(
          `Please configure your ${settings.provider.toUpperCase()} API key`
        );
        return null;
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsTranscribing(true);
      setError(null);

      try {
        // Fetch the audio from URL and convert to Blob
        const response = await fetch(url);
        const audioBlob = await response.blob();

        const transcriptionResult = await transcribeAudio(
          {
            provider: settings.provider,
            apiKey,
            model: settings.transcriptionSettings.model,
          },
          {
            audio: audioBlob,
            language: opts?.language || settings.transcriptionSettings.language,
            prompt: opts?.prompt,
            abortSignal: abortControllerRef.current.signal,
          }
        );

        setResult(transcriptionResult);
        onSuccess?.(transcriptionResult);
        return transcriptionResult;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [settings, onSuccess, onError]
  );

  const clearResult = useCallback(() => setResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    transcribe,
    transcribeFromUrl,
    isTranscribing,
    error,
    result,
    clearResult,
    clearError,
    isValidFile: isValidAudioFile,
  };
}

// ============================================================================
// Utility: Download generated image
// ============================================================================

export function downloadImage(
  base64: string,
  filename: string = "generated-image.png"
) {
  const link = document.createElement("a");
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Utility: Download generated audio
// ============================================================================

export function downloadAudio(
  audioUrl: string,
  filename: string = "generated-audio.mp3"
) {
  const link = document.createElement("a");
  link.href = audioUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Utility: Copy text to clipboard
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
