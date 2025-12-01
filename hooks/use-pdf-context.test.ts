/**
 * Tests for usePDFContext hook (hooks/use-pdf-context.ts)
 */

import { renderHook, act } from "@testing-library/react";
import { usePDFContext } from "./use-pdf-context";
import { usePDFStore } from "@/lib/pdf";
import { useAIChatStore } from "@/lib/ai/core";

// Reset stores before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset PDF store
  usePDFStore.setState({
    currentPage: 1,
    numPages: 10,
    annotations: [],
    bookmarks: [],
    currentPDF: new File(["test"], "test.pdf", { type: "application/pdf" }),
  });

  // Reset AI chat store
  useAIChatStore.setState({
    pdfContext: null,
  });
});

describe("usePDFContext", () => {
  describe("PDF Context Sync", () => {
    it("should sync PDF context when PDF is loaded", () => {
      renderHook(() => usePDFContext());

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext).not.toBeNull();
      expect(pdfContext?.fileName).toBe("test.pdf");
      expect(pdfContext?.currentPage).toBe(1);
      expect(pdfContext?.totalPages).toBe(10);
    });

    it("should clear PDF context when no pages are loaded", () => {
      usePDFStore.setState({ numPages: 0 });

      renderHook(() => usePDFContext());

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext).toBeNull();
    });

    it("should update context when current page changes", () => {
      const { rerender } = renderHook(() => usePDFContext());

      act(() => {
        usePDFStore.setState({ currentPage: 5 });
      });

      rerender();

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.currentPage).toBe(5);
    });

    it("should include annotations for current page", () => {
      usePDFStore.setState({
        currentPage: 2,
        annotations: [
          {
            id: "1",
            pageNumber: 1,
            type: "highlight",
            content: "Page 1 note",
            color: "#ffff00",
            position: { x: 0, y: 0, width: 100, height: 20 },
            timestamp: Date.now(),
          },
          {
            id: "2",
            pageNumber: 2,
            type: "highlight",
            content: "Page 2 note",
            color: "#ffff00",
            position: { x: 0, y: 0, width: 100, height: 20 },
            timestamp: Date.now(),
          },
          {
            id: "3",
            pageNumber: 2,
            type: "highlight",
            content: "Another page 2 note",
            color: "#ffff00",
            position: { x: 0, y: 0, width: 100, height: 20 },
            timestamp: Date.now(),
          },
        ],
      });

      renderHook(() => usePDFContext());

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.annotations).toHaveLength(2);
      expect(pdfContext?.annotations?.[0].text).toBe("Page 2 note");
    });

    it("should include bookmarks", () => {
      usePDFStore.setState({
        bookmarks: [
          { id: "1", title: "Chapter 1", pageNumber: 1, timestamp: Date.now() },
          { id: "2", title: "Chapter 2", pageNumber: 5, timestamp: Date.now() },
        ],
      });

      renderHook(() => usePDFContext());

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.bookmarks).toHaveLength(2);
      expect(pdfContext?.bookmarks?.[0].title).toBe("Chapter 1");
    });
  });

  describe("setPageText", () => {
    it("should set page text", () => {
      const { result } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setPageText("This is the page content");
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.pageText).toBe("This is the page content");
    });
  });

  describe("clearPageText", () => {
    it("should clear page text", () => {
      const { result } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setPageText("Some text");
      });

      act(() => {
        result.current.clearPageText();
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.pageText).toBeUndefined();
    });
  });

  describe("setSelectedText", () => {
    it("should set selected text", () => {
      const { result } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setSelectedText("User selected this text");
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.selectedText).toBe("User selected this text");
    });
  });

  describe("clearSelectedText", () => {
    it("should clear selected text", () => {
      const { result } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setSelectedText("Selected");
      });

      act(() => {
        result.current.clearSelectedText();
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.selectedText).toBeUndefined();
    });
  });

  describe("setPageImages", () => {
    it("should set page images", () => {
      const { result } = renderHook(() => usePDFContext());

      const images = [
        {
          pageNumber: 1,
          dataUrl: "data:image/png;base64,abc123",
          width: 800,
          height: 600,
        },
        {
          pageNumber: 2,
          dataUrl: "data:image/png;base64,def456",
          width: 800,
          height: 600,
        },
      ];

      act(() => {
        result.current.setPageImages(images);
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.pageImages).toHaveLength(2);
      expect(pdfContext?.pageImages?.[0].pageNumber).toBe(1);
    });
  });

  describe("clearPageImages", () => {
    it("should clear page images", () => {
      const { result } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setPageImages([
          {
            pageNumber: 1,
            dataUrl: "data:image/png;base64,abc",
            width: 800,
            height: 600,
          },
        ]);
      });

      act(() => {
        result.current.clearPageImages();
      });

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.pageImages).toBeUndefined();
    });
  });

  describe("Preserving Existing Context", () => {
    it("should preserve pageText when PDF state changes", () => {
      const { result, rerender } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setPageText("Preserved text");
      });

      // Change page
      act(() => {
        usePDFStore.setState({ currentPage: 3 });
      });

      rerender();

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.pageText).toBe("Preserved text");
      expect(pdfContext?.currentPage).toBe(3);
    });

    it("should preserve selectedText when PDF state changes", () => {
      const { result, rerender } = renderHook(() => usePDFContext());

      act(() => {
        result.current.setSelectedText("Selected content");
      });

      // Change page
      act(() => {
        usePDFStore.setState({ currentPage: 2 });
      });

      rerender();

      const pdfContext = useAIChatStore.getState().pdfContext;
      expect(pdfContext?.selectedText).toBe("Selected content");
    });
  });
});
