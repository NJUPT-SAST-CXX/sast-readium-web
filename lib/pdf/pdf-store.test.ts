import { usePDFStore } from "./pdf-store";
import { act } from "@testing-library/react";

describe("pdf-store", () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      usePDFStore.getState().resetPDF();
    });
  });

  it("should have initial state", () => {
    const state = usePDFStore.getState();
    expect(state.zoom).toBe(1.0);
    expect(state.currentPage).toBe(1);
    expect(state.annotations).toEqual([]);
  });

  it("should update current page", () => {
    act(() => {
      usePDFStore.getState().setNumPages(10);
      usePDFStore.getState().setCurrentPage(5);
    });
    expect(usePDFStore.getState().currentPage).toBe(5);
  });

  it("should handle next/prev page", () => {
    act(() => {
      usePDFStore.getState().setNumPages(10);
      usePDFStore.getState().setCurrentPage(5);
      usePDFStore.getState().nextPage();
    });
    expect(usePDFStore.getState().currentPage).toBe(6);

    act(() => {
      usePDFStore.getState().previousPage();
    });
    expect(usePDFStore.getState().currentPage).toBe(5);
  });

  it("should not go out of bounds", () => {
    act(() => {
      usePDFStore.getState().setNumPages(10);
      usePDFStore.getState().setCurrentPage(10);
      usePDFStore.getState().nextPage();
    });
    expect(usePDFStore.getState().currentPage).toBe(10);

    act(() => {
      usePDFStore.getState().setCurrentPage(1);
      usePDFStore.getState().previousPage();
    });
    expect(usePDFStore.getState().currentPage).toBe(1);
  });

  it("should handle zoom", () => {
    act(() => {
      usePDFStore.getState().setZoom(1.5);
    });
    expect(usePDFStore.getState().zoom).toBe(1.5);

    act(() => {
      usePDFStore.getState().zoomIn();
    });
    expect(usePDFStore.getState().zoom).toBe(1.75);

    act(() => {
      usePDFStore.getState().zoomOut();
    });
    expect(usePDFStore.getState().zoom).toBe(1.5);
  });

  it("should add and remove annotations", () => {
    const annotation = {
      type: "highlight" as const,
      pageNumber: 1,
      color: "red",
      position: { x: 10, y: 10, width: 100, height: 100 },
    };

    act(() => {
      usePDFStore.getState().addAnnotation(annotation);
    });

    const state = usePDFStore.getState();
    expect(state.annotations).toHaveLength(1);
    expect(state.annotations[0].type).toBe("highlight");
    expect(state.annotations[0].id).toBeDefined();

    const id = state.annotations[0].id;

    act(() => {
      usePDFStore.getState().removeAnnotation(id);
    });

    expect(usePDFStore.getState().annotations).toHaveLength(0);
  });

  it("should handle undo/redo for annotations", () => {
    const annotation = {
      type: "highlight" as const,
      pageNumber: 1,
      color: "red",
      position: { x: 10, y: 10, width: 100, height: 100 },
    };

    act(() => {
      usePDFStore.getState().addAnnotation(annotation);
    });

    expect(usePDFStore.getState().annotations).toHaveLength(1);
    expect(usePDFStore.getState().canUndo()).toBe(true);

    act(() => {
      usePDFStore.getState().undoAnnotation();
    });

    expect(usePDFStore.getState().annotations).toHaveLength(0);
    expect(usePDFStore.getState().canRedo()).toBe(true);

    act(() => {
      usePDFStore.getState().redoAnnotation();
    });

    expect(usePDFStore.getState().annotations).toHaveLength(1);
  });
});
