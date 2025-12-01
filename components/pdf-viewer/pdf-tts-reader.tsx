import { useEffect, useRef } from "react";
import { usePDFStore } from "@/lib/pdf";
import { useTTS } from "@/hooks/use-tts";
import { PDFPageProxy } from "@/lib/pdf";

interface PDFTTSReaderProps {
  currentPageObj: PDFPageProxy | null;
}

export function PDFTTSReader({ currentPageObj }: PDFTTSReaderProps) {
  const {
    isReading,
    setIsReading,
    currentPage,
    numPages,
    nextPage,
    speechRate,
    speechVolume,
  } = usePDFStore();

  const { speak, cancel } = useTTS();
  const lastReadPageRef = useRef<number>(-1);

  useEffect(() => {
    if (!isReading) {
      cancel();
      lastReadPageRef.current = -1;
      return;
    }

    if (currentPage === lastReadPageRef.current) {
      return;
    }

    const readCurrentPage = async () => {
      if (!currentPageObj) return;

      try {
        const textContent = await currentPageObj.getTextContent();
        const text = textContent.items
          .map((item) => (item as { str?: string }).str || "")
          .join(" ");

        if (text.trim().length === 0) {
          // Skip empty pages or just wait a bit then next
          if (currentPage < numPages) {
            nextPage();
          } else {
            setIsReading(false);
          }
          return;
        }

        speak(text, {
          rate: speechRate,
          volume: speechVolume,
          onEnd: () => {
            if (currentPage < numPages) {
              nextPage();
            } else {
              setIsReading(false);
            }
          },
          onError: () => {
            setIsReading(false);
          },
        });

        lastReadPageRef.current = currentPage;
      } catch (err) {
        console.error("TTS Error extracting text:", err);
        setIsReading(false);
      }
    };

    readCurrentPage();
  }, [
    isReading,
    currentPage,
    currentPageObj,
    speak,
    cancel,
    nextPage,
    numPages,
    setIsReading,
    speechRate,
    speechVolume,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return null;
}
