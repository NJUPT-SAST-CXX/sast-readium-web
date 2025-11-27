import { useEffect, useCallback } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import { useAIChatStore, type PDFContext, type PDFPageImage } from "@/lib/ai-chat-store";

/**
 * Hook to sync PDF state with AI chat context
 * This automatically updates the PDF context in the AI store when PDF state changes
 */
export function usePDFContext() {
  const {
    currentPage,
    numPages,
    annotations,
    bookmarks,
    currentPDF,
  } = usePDFStore();

  const { setPDFContext, updatePDFContext, pdfContext } = useAIChatStore();

  // Update PDF context when PDF state changes
  useEffect(() => {
    // Only set context if we have pages loaded (indicating a PDF is open)
    if (!numPages || numPages === 0) {
      setPDFContext(null);
      return;
    }

    // Get the real filename from currentPDF or use a placeholder
    const fileName = currentPDF?.name || "current.pdf";

    const context: PDFContext = {
      fileName,
      currentPage: currentPage || 1,
      totalPages: numPages || 0,
      // Preserve existing pageText and selectedText if they exist
      pageText: pdfContext?.pageText,
      selectedText: pdfContext?.selectedText,
      pageImages: pdfContext?.pageImages,
      annotations: annotations
        ?.filter((ann) => ann.pageNumber === currentPage)
        .map((ann) => ({
          type: ann.type,
          text: ann.content || "",
          pageNumber: ann.pageNumber,
        })),
      bookmarks: bookmarks?.map((bm) => ({
        title: bm.title,
        pageNumber: bm.pageNumber,
      })),
    };

    setPDFContext(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    numPages,
    annotations,
    bookmarks,
    currentPDF,
    setPDFContext,
    // Note: We intentionally don't include pdfContext here to avoid infinite loops
    // The preserved fields (pageText, selectedText, pageImages) are only used for initial merge
  ]);

  /**
   * Set page text content for AI context
   */
  const setPageText = useCallback((text: string) => {
    updatePDFContext({ pageText: text });
  }, [updatePDFContext]);

  /**
   * Clear page text
   */
  const clearPageText = useCallback(() => {
    updatePDFContext({ pageText: undefined });
  }, [updatePDFContext]);

  /**
   * Set selected text from user selection
   */
  const setSelectedText = useCallback((text: string) => {
    updatePDFContext({ selectedText: text });
  }, [updatePDFContext]);

  /**
   * Clear selected text
   */
  const clearSelectedText = useCallback(() => {
    updatePDFContext({ selectedText: undefined });
  }, [updatePDFContext]);

  /**
   * Set page images for AI vision context
   */
  const setPageImages = useCallback((images: PDFPageImage[]) => {
    updatePDFContext({ pageImages: images });
  }, [updatePDFContext]);

  /**
   * Clear page images
   */
  const clearPageImages = useCallback(() => {
    updatePDFContext({ pageImages: undefined });
  }, [updatePDFContext]);

  return {
    setPageText,
    clearPageText,
    setSelectedText,
    clearSelectedText,
    setPageImages,
    clearPageImages,
  };
}
