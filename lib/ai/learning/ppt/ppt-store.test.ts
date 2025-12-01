/**
 * Tests for PPT Store
 */

import { act } from "@testing-library/react";
import { usePPTStore } from "./ppt-store";
import type { SlideElement } from "../types";

// Reset store before each test
beforeEach(() => {
  act(() => {
    usePPTStore.getState().clearAllData();
  });
});

// Helper to create a text element
function createTextElement(content: string = "Test"): Omit<SlideElement, "id"> {
  return {
    type: "text",
    content,
    position: { x: 100, y: 100 },
    size: { width: 200, height: 50 },
    style: { fontSize: 16 },
    zIndex: 1,
  };
}

describe("ppt-store", () => {
  describe("Presentation CRUD", () => {
    it("should create a presentation", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test Presentation");
      });
      const pres = usePPTStore.getState().getPresentationById(presId!);
      expect(pres).not.toBeNull();
      expect(pres?.title).toBe("Test Presentation");
      expect(pres?.slides).toHaveLength(1); // Title slide created by default
    });

    it("should create presentation with source document", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore
          .getState()
          .createPresentation("PDF Presentation", undefined, {
            id: "doc-123",
            name: "test.pdf",
          });
      });
      const pres = usePPTStore.getState().getPresentationById(presId!);
      expect(pres?.sourceDocumentId).toBe("doc-123");
      expect(pres?.sourceFileName).toBe("test.pdf");
    });

    it("should delete a presentation", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("To Delete");
      });
      expect(
        usePPTStore.getState().getPresentationById(presId!)
      ).not.toBeNull();
      act(() => {
        usePPTStore.getState().deletePresentation(presId!);
      });
      expect(usePPTStore.getState().getPresentationById(presId!)).toBeNull();
    });

    it("should update presentation", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("Original");
      });
      act(() => {
        usePPTStore
          .getState()
          .updatePresentation(presId!, { title: "Updated" });
      });
      expect(usePPTStore.getState().getPresentationById(presId!)?.title).toBe(
        "Updated"
      );
    });

    it("should duplicate presentation", () => {
      let presId: string;
      let dupId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("Original");
        dupId = usePPTStore.getState().duplicatePresentation(presId);
      });
      const dup = usePPTStore.getState().getPresentationById(dupId!);
      expect(dup).not.toBeNull();
      expect(dup?.title).toBe("Original (Copy)");
      expect(dup?.id).not.toBe(presId!);
    });

    it("should get all presentations", () => {
      act(() => {
        usePPTStore.getState().createPresentation("Pres 1");
        usePPTStore.getState().createPresentation("Pres 2");
      });
      expect(usePPTStore.getState().getAllPresentations()).toHaveLength(2);
    });

    it("should set current presentation", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test");
      });
      expect(usePPTStore.getState().currentPresentationId).toBe(presId!);
      act(() => {
        usePPTStore.getState().setCurrentPresentation(null);
      });
      expect(usePPTStore.getState().currentPresentationId).toBeNull();
    });
  });

  describe("Slide Management", () => {
    let presId: string;

    beforeEach(() => {
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test");
      });
    });

    it("should add a slide", () => {
      const initialCount =
        usePPTStore.getState().getPresentationById(presId)?.slides.length ?? 0;
      act(() => {
        usePPTStore.getState().addSlide(presId);
      });
      expect(
        usePPTStore.getState().getPresentationById(presId)?.slides
      ).toHaveLength(initialCount + 1);
    });

    it("should delete a slide (keep at least one)", () => {
      let slideId: string;
      act(() => {
        slideId = usePPTStore.getState().addSlide(presId);
      });
      const countBefore =
        usePPTStore.getState().getPresentationById(presId)?.slides.length ?? 0;
      act(() => {
        usePPTStore.getState().deleteSlide(presId, slideId!);
      });
      expect(
        usePPTStore.getState().getPresentationById(presId)?.slides
      ).toHaveLength(countBefore - 1);
    });

    it("should not delete last slide", () => {
      const pres = usePPTStore.getState().getPresentationById(presId);
      const firstSlideId = pres?.slides[0]?.id;
      act(() => {
        usePPTStore.getState().deleteSlide(presId, firstSlideId!);
      });
      // Should still have 1 slide
      expect(
        usePPTStore.getState().getPresentationById(presId)?.slides
      ).toHaveLength(1);
    });

    it("should update slide", () => {
      const pres = usePPTStore.getState().getPresentationById(presId);
      const slideId = pres?.slides[0]?.id;
      act(() => {
        usePPTStore
          .getState()
          .updateSlide(presId, slideId!, { title: "Updated Title" });
      });
      const updated = usePPTStore.getState().getPresentationById(presId)
        ?.slides[0];
      expect(updated?.title).toBe("Updated Title");
    });

    it("should duplicate slide", () => {
      const pres = usePPTStore.getState().getPresentationById(presId);
      const slideId = pres?.slides[0]?.id;
      act(() => {
        usePPTStore.getState().duplicateSlide(presId, slideId!);
      });
      expect(
        usePPTStore.getState().getPresentationById(presId)?.slides
      ).toHaveLength(2);
    });

    it("should reorder slides", () => {
      let slide2Id: string;
      act(() => {
        slide2Id = usePPTStore.getState().addSlide(presId);
      });
      const pres = usePPTStore.getState().getPresentationById(presId);
      const slide1Id = pres?.slides[0]?.id;
      act(() => {
        usePPTStore.getState().reorderSlides(presId, [slide2Id!, slide1Id!]);
      });
      const reordered = usePPTStore.getState().getPresentationById(presId);
      expect(reordered?.slides[0]?.id).toBe(slide2Id!);
    });
  });

  describe("Element Management", () => {
    let presId: string;
    let slideId: string;

    beforeEach(() => {
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test");
        const pres = usePPTStore.getState().getPresentationById(presId);
        slideId = pres?.slides[0]?.id ?? "";
      });
    });

    it("should add element", () => {
      act(() => {
        usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("Hello"));
      });
      const slide = usePPTStore.getState().getPresentationById(presId)
        ?.slides[0];
      // Title slide already has a title element, so we expect at least 2
      expect(slide?.elements.length).toBeGreaterThanOrEqual(2);
    });

    it("should update element", () => {
      let elementId: string;
      act(() => {
        elementId = usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("Original"));
      });
      act(() => {
        usePPTStore
          .getState()
          .updateElement(presId, slideId, elementId!, { content: "Updated" });
      });
      const slide = usePPTStore.getState().getPresentationById(presId)
        ?.slides[0];
      const element = slide?.elements.find((e) => e.id === elementId!);
      expect(element?.content).toBe("Updated");
    });

    it("should delete element", () => {
      let elementId: string;
      act(() => {
        elementId = usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("To Delete"));
      });
      const countBefore =
        usePPTStore.getState().getPresentationById(presId)?.slides[0]?.elements
          .length ?? 0;
      act(() => {
        usePPTStore.getState().deleteElement(presId, slideId, elementId!);
      });
      expect(
        usePPTStore.getState().getPresentationById(presId)?.slides[0]?.elements
      ).toHaveLength(countBefore - 1);
    });

    it("should move element", () => {
      let elementId: string;
      act(() => {
        elementId = usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("Move Me"));
      });
      act(() => {
        usePPTStore
          .getState()
          .moveElement(presId, slideId, elementId!, { x: 300, y: 400 });
      });
      const slide = usePPTStore.getState().getPresentationById(presId)
        ?.slides[0];
      const element = slide?.elements.find((e) => e.id === elementId!);
      expect(element?.position).toEqual({ x: 300, y: 400 });
    });

    it("should resize element", () => {
      let elementId: string;
      act(() => {
        elementId = usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("Resize Me"));
      });
      act(() => {
        usePPTStore.getState().resizeElement(presId, slideId, elementId!, {
          width: 500,
          height: 100,
        });
      });
      const slide = usePPTStore.getState().getPresentationById(presId)
        ?.slides[0];
      const element = slide?.elements.find((e) => e.id === elementId!);
      expect(element?.size).toEqual({ width: 500, height: 100 });
    });
  });

  describe("Selection", () => {
    let presId: string;
    let slideId: string;
    let elementId: string;

    beforeEach(() => {
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test");
        const pres = usePPTStore.getState().getPresentationById(presId);
        slideId = pres?.slides[0]?.id ?? "";
        elementId = usePPTStore
          .getState()
          .addElement(presId, slideId, createTextElement("Select Me"));
      });
    });

    it("should set selected elements", () => {
      act(() => {
        usePPTStore.getState().setSelectedElements([elementId]);
      });
      expect(usePPTStore.getState().selectedElementIds).toContain(elementId);
    });

    it("should add to selection", () => {
      act(() => {
        usePPTStore.getState().addToSelection(elementId);
      });
      expect(usePPTStore.getState().selectedElementIds).toContain(elementId);
    });

    it("should remove from selection", () => {
      act(() => {
        usePPTStore.getState().setSelectedElements([elementId]);
        usePPTStore.getState().removeFromSelection(elementId);
      });
      expect(usePPTStore.getState().selectedElementIds).not.toContain(
        elementId
      );
    });

    it("should clear selection", () => {
      act(() => {
        usePPTStore.getState().setSelectedElements([elementId]);
        usePPTStore.getState().clearSelection();
      });
      expect(usePPTStore.getState().selectedElementIds).toHaveLength(0);
    });
  });

  describe("Preview Mode", () => {
    let presId: string;

    beforeEach(() => {
      act(() => {
        presId = usePPTStore.getState().createPresentation("Test");
        usePPTStore.getState().addSlide(presId);
        usePPTStore.getState().addSlide(presId);
      });
    });

    it("should enter preview mode", () => {
      act(() => {
        usePPTStore.getState().enterPreviewMode();
      });
      expect(usePPTStore.getState().isPreviewMode).toBe(true);
    });

    it("should exit preview mode", () => {
      act(() => {
        usePPTStore.getState().enterPreviewMode();
        usePPTStore.getState().exitPreviewMode();
      });
      expect(usePPTStore.getState().isPreviewMode).toBe(false);
    });

    it("should navigate preview slides", () => {
      // Select first slide before entering preview
      const pres = usePPTStore.getState().getPresentationById(presId);
      act(() => {
        usePPTStore.getState().setSelectedSlide(pres?.slides[0]?.id ?? null);
        usePPTStore.getState().enterPreviewMode();
      });
      expect(usePPTStore.getState().previewSlideIndex).toBe(0);
      act(() => {
        usePPTStore.getState().nextPreviewSlide();
      });
      expect(usePPTStore.getState().previewSlideIndex).toBe(1);
      act(() => {
        usePPTStore.getState().previousPreviewSlide();
      });
      expect(usePPTStore.getState().previewSlideIndex).toBe(0);
    });

    it("should go to specific slide", () => {
      act(() => {
        usePPTStore.getState().enterPreviewMode();
        usePPTStore.getState().goToPreviewSlide(2);
      });
      expect(usePPTStore.getState().previewSlideIndex).toBe(2);
    });
  });

  describe("UI Controls", () => {
    it("should set zoom", () => {
      act(() => {
        usePPTStore.getState().setZoom(150);
      });
      expect(usePPTStore.getState().zoom).toBe(150);
    });

    it("should clamp zoom to valid range", () => {
      act(() => {
        usePPTStore.getState().setZoom(10); // Below min
      });
      expect(usePPTStore.getState().zoom).toBe(25);
      act(() => {
        usePPTStore.getState().setZoom(300); // Above max
      });
      expect(usePPTStore.getState().zoom).toBe(200);
    });

    it("should toggle grid", () => {
      const initial = usePPTStore.getState().showGrid;
      act(() => {
        usePPTStore.getState().toggleGrid();
      });
      expect(usePPTStore.getState().showGrid).toBe(!initial);
    });

    it("should toggle notes", () => {
      const initial = usePPTStore.getState().showNotes;
      act(() => {
        usePPTStore.getState().toggleNotes();
      });
      expect(usePPTStore.getState().showNotes).toBe(!initial);
    });
  });

  describe("Generation State", () => {
    it("should set generating state", () => {
      act(() => {
        usePPTStore.getState().setGenerating(true, 50);
      });
      expect(usePPTStore.getState().isGenerating).toBe(true);
      expect(usePPTStore.getState().generationProgress).toBe(50);
    });
  });

  describe("Import/Export", () => {
    it("should export presentation", () => {
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("Export Test");
      });
      const exported = usePPTStore.getState().exportPresentation(presId!);
      expect(exported).not.toBeNull();
      expect(exported?.title).toBe("Export Test");
    });

    it("should import presentation", () => {
      // Create and export a presentation
      let presId: string;
      act(() => {
        presId = usePPTStore.getState().createPresentation("To Import");
      });
      const toImport = usePPTStore.getState().exportPresentation(presId!);

      // Clear and import
      act(() => {
        usePPTStore.getState().clearAllData();
      });
      expect(usePPTStore.getState().getAllPresentations()).toHaveLength(0);

      let importedId: string;
      act(() => {
        importedId = usePPTStore.getState().importPresentation(toImport!);
      });
      const imported = usePPTStore.getState().getPresentationById(importedId!);
      expect(imported).not.toBeNull();
      expect(imported?.title).toBe("To Import");
      expect(imported?.id).not.toBe(presId!); // New ID
    });
  });

  describe("Clear Operations", () => {
    it("should clear all data", () => {
      act(() => {
        usePPTStore.getState().createPresentation("Test");
        usePPTStore.getState().clearAllData();
      });
      expect(usePPTStore.getState().getAllPresentations()).toHaveLength(0);
      expect(usePPTStore.getState().currentPresentationId).toBeNull();
    });
  });
});
