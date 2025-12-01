/**
 * PPT Store - Zustand state management for presentation system
 *
 * Features:
 * - Presentation management (CRUD operations)
 * - Slide management with element composition
 * - Drag-and-drop element positioning
 * - Theme management
 * - Undo/redo history
 * - Preview mode
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Presentation,
  Slide,
  SlideElement,
  SlideElementStyle,
  SlideElementType,
  SlideLayout,
  PresentationTheme,
} from "../types";
import { DEFAULT_THEMES } from "../types";

// ============================================================================
// Types
// ============================================================================

interface HistoryState {
  past: Presentation[];
  future: Presentation[];
}

interface PPTState {
  // Data
  presentations: Record<string, Presentation>;

  // Current editing state
  currentPresentationId: string | null;
  selectedSlideId: string | null;
  selectedElementIds: string[];

  // UI State
  isEditing: boolean;
  isPreviewMode: boolean;
  previewSlideIndex: number;
  isGenerating: boolean;
  generationProgress: number;
  zoom: number;
  showGrid: boolean;
  showNotes: boolean;

  // Clipboard
  clipboard: SlideElement[] | null;

  // History for undo/redo (per presentation)
  history: Record<string, HistoryState>;

  // Actions - Presentation management
  createPresentation: (
    title: string,
    themeId?: string,
    sourceDoc?: { id: string; name: string }
  ) => string;
  deletePresentation: (id: string) => void;
  updatePresentation: (
    id: string,
    updates: Partial<Omit<Presentation, "id" | "slides">>
  ) => void;
  setCurrentPresentation: (id: string | null) => void;
  duplicatePresentation: (id: string) => string;

  // Actions - Slide management
  addSlide: (
    presentationId: string,
    slide?: Partial<Omit<Slide, "id">>
  ) => string;
  deleteSlide: (presentationId: string, slideId: string) => void;
  updateSlide: (
    presentationId: string,
    slideId: string,
    updates: Partial<Omit<Slide, "id">>
  ) => void;
  duplicateSlide: (presentationId: string, slideId: string) => string;
  reorderSlides: (presentationId: string, newOrder: string[]) => void;
  setSelectedSlide: (slideId: string | null) => void;

  // Actions - Element management
  addElement: (
    presentationId: string,
    slideId: string,
    element: Omit<SlideElement, "id">
  ) => string;
  updateElement: (
    presentationId: string,
    slideId: string,
    elementId: string,
    updates: Partial<Omit<SlideElement, "id">>
  ) => void;
  deleteElement: (
    presentationId: string,
    slideId: string,
    elementId: string
  ) => void;
  deleteSelectedElements: () => void;
  setSelectedElements: (elementIds: string[]) => void;
  addToSelection: (elementId: string) => void;
  removeFromSelection: (elementId: string) => void;
  clearSelection: () => void;

  // Element positioning
  moveElement: (
    presentationId: string,
    slideId: string,
    elementId: string,
    position: { x: number; y: number }
  ) => void;
  resizeElement: (
    presentationId: string,
    slideId: string,
    elementId: string,
    size: { width: number; height: number }
  ) => void;
  bringToFront: (
    presentationId: string,
    slideId: string,
    elementId: string
  ) => void;
  sendToBack: (
    presentationId: string,
    slideId: string,
    elementId: string
  ) => void;
  bringForward: (
    presentationId: string,
    slideId: string,
    elementId: string
  ) => void;
  sendBackward: (
    presentationId: string,
    slideId: string,
    elementId: string
  ) => void;

  // Clipboard operations
  copyElements: () => void;
  cutElements: () => void;
  pasteElements: () => void;

  // Theme
  setTheme: (presentationId: string, theme: PresentationTheme) => void;

  // Preview
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
  nextPreviewSlide: () => void;
  previousPreviewSlide: () => void;
  goToPreviewSlide: (index: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;

  // UI controls
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleNotes: () => void;
  setEditing: (editing: boolean) => void;

  // Getters
  getCurrentPresentation: () => Presentation | null;
  getSelectedSlide: () => Slide | null;
  getPresentationById: (id: string) => Presentation | null;
  getAllPresentations: () => Presentation[];

  // Generation
  setGenerating: (isGenerating: boolean, progress?: number) => void;

  // Bulk operations
  importPresentation: (presentation: Presentation) => string;
  exportPresentation: (presentationId: string) => Presentation | null;
  clearAllData: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_THEME: PresentationTheme = {
  id: "default",
  name: "Default",
  primaryColor: "#1a1a2e",
  secondaryColor: "#16213e",
  backgroundColor: "#ffffff",
  fontFamily: "Inter, sans-serif",
  titleFontSize: 36,
  bodyFontSize: 18,
};

const SLIDE_WIDTH = 960; // 16:9 aspect ratio base
const SLIDE_HEIGHT = 540;

function createDefaultSlide(order: number): Omit<Slide, "id"> {
  return {
    title: order === 0 ? "Title Slide" : `Slide ${order + 1}`,
    elements: [],
    notes: "",
    layout: order === 0 ? "title" : "content",
    order,
  };
}

function createTitleElement(
  title: string,
  theme: PresentationTheme
): Omit<SlideElement, "id"> {
  return {
    type: "text",
    content: title,
    position: { x: 50, y: 200 },
    size: { width: 860, height: 80 },
    style: {
      fontSize: theme.titleFontSize,
      fontWeight: "bold",
      textAlign: "center",
      color: theme.primaryColor,
    },
    zIndex: 1,
  };
}

// ============================================================================
// Store Implementation
// ============================================================================

const MAX_HISTORY_SIZE = 30;

export const usePPTStore = create<PPTState>()(
  persist(
    (set, get) => ({
      // Initial state
      presentations: {},
      currentPresentationId: null,
      selectedSlideId: null,
      selectedElementIds: [],
      isEditing: false,
      isPreviewMode: false,
      previewSlideIndex: 0,
      isGenerating: false,
      generationProgress: 0,
      zoom: 100,
      showGrid: false,
      showNotes: true,
      clipboard: null,
      history: {},

      // Presentation management
      createPresentation: (title, themeId, sourceDoc) => {
        const id = nanoid();
        const now = Date.now();
        const theme =
          DEFAULT_THEMES?.find((t) => t.id === themeId) || DEFAULT_THEME;

        // Create title slide
        const titleSlideId = nanoid();
        const titleSlide: Slide = {
          id: titleSlideId,
          ...createDefaultSlide(0),
          elements: [
            {
              id: nanoid(),
              ...createTitleElement(title, theme),
            },
          ],
        };

        const presentation: Presentation = {
          id,
          title,
          slides: [titleSlide],
          theme,
          createdAt: now,
          updatedAt: now,
          sourceDocumentId: sourceDoc?.id,
          sourceFileName: sourceDoc?.name,
        };

        set((state) => ({
          presentations: { ...state.presentations, [id]: presentation },
          currentPresentationId: id,
          selectedSlideId: titleSlideId,
          selectedElementIds: [],
          isEditing: true,
          history: {
            ...state.history,
            [id]: { past: [], future: [] },
          },
        }));

        return id;
      },

      deletePresentation: (id) => {
        set((state) => {
          const { [id]: deleted, ...remaining } = state.presentations;
          const { [id]: deletedHistory, ...remainingHistory } = state.history;
          return {
            presentations: remaining,
            history: remainingHistory,
            currentPresentationId:
              state.currentPresentationId === id
                ? null
                : state.currentPresentationId,
          };
        });
      },

      updatePresentation: (id, updates) => {
        set((state) => {
          const pres = state.presentations[id];
          if (!pres) return state;

          return {
            presentations: {
              ...state.presentations,
              [id]: {
                ...pres,
                ...updates,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setCurrentPresentation: (id) => {
        const state = get();
        const pres = id ? state.presentations[id] : null;
        set({
          currentPresentationId: id,
          selectedSlideId: pres?.slides[0]?.id ?? null,
          selectedElementIds: [],
          isEditing: !!id,
        });
      },

      duplicatePresentation: (id) => {
        const state = get();
        const original = state.presentations[id];
        if (!original) return "";

        const newId = nanoid();
        const now = Date.now();

        // Deep clone slides with new IDs
        const newSlides = original.slides.map((slide) => ({
          ...slide,
          id: nanoid(),
          elements: slide.elements.map((el) => ({
            ...el,
            id: nanoid(),
          })),
        }));

        const newPresentation: Presentation = {
          ...original,
          id: newId,
          title: `${original.title} (Copy)`,
          slides: newSlides,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          presentations: { ...state.presentations, [newId]: newPresentation },
          history: {
            ...state.history,
            [newId]: { past: [], future: [] },
          },
        }));

        return newId;
      },

      // Slide management
      addSlide: (presentationId, slideData) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return "";

        get().saveToHistory();

        const slideId = nanoid();
        const order = pres.slides.length;
        const newSlide: Slide = {
          id: slideId,
          ...createDefaultSlide(order),
          ...slideData,
          order,
        };

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: [...pres.slides, newSlide],
              updatedAt: Date.now(),
            },
          },
          selectedSlideId: slideId,
        }));

        return slideId;
      },

      deleteSlide: (presentationId, slideId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres || pres.slides.length <= 1) return; // Keep at least one slide

        get().saveToHistory();

        const slideIndex = pres.slides.findIndex((s) => s.id === slideId);
        const newSlides = pres.slides
          .filter((s) => s.id !== slideId)
          .map((s, i) => ({ ...s, order: i }));

        // Select adjacent slide
        const newSelectedId =
          newSlides[Math.min(slideIndex, newSlides.length - 1)]?.id ?? null;

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          },
          selectedSlideId: newSelectedId,
          selectedElementIds: [],
        }));
      },

      updateSlide: (presentationId, slideId, updates) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        get().saveToHistory();

        const slideIndex = pres.slides.findIndex((s) => s.id === slideId);
        if (slideIndex === -1) return;

        const updatedSlides = [...pres.slides];
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          ...updates,
        };

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      duplicateSlide: (presentationId, slideId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return "";

        get().saveToHistory();

        const originalSlide = pres.slides.find((s) => s.id === slideId);
        if (!originalSlide) return "";

        const newSlideId = nanoid();
        const originalIndex = pres.slides.findIndex((s) => s.id === slideId);

        const newSlide: Slide = {
          ...originalSlide,
          id: newSlideId,
          title: `${originalSlide.title} (Copy)`,
          elements: originalSlide.elements.map((el) => ({
            ...el,
            id: nanoid(),
          })),
        };

        // Insert after original
        const newSlides = [...pres.slides];
        newSlides.splice(originalIndex + 1, 0, newSlide);

        // Update order
        newSlides.forEach((s, i) => (s.order = i));

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          },
          selectedSlideId: newSlideId,
        }));

        return newSlideId;
      },

      reorderSlides: (presentationId, newOrder) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        get().saveToHistory();

        const slideMap = new Map(pres.slides.map((s) => [s.id, s]));
        const reorderedSlides = newOrder
          .map((id) => slideMap.get(id))
          .filter((s): s is Slide => s !== undefined)
          .map((s, i) => ({ ...s, order: i }));

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: reorderedSlides,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setSelectedSlide: (slideId) => {
        set({ selectedSlideId: slideId, selectedElementIds: [] });
      },

      // Element management
      addElement: (presentationId, slideId, elementData) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return "";

        get().saveToHistory();

        const elementId = nanoid();
        const slideIndex = pres.slides.findIndex((s) => s.id === slideId);
        if (slideIndex === -1) return "";

        const slide = pres.slides[slideIndex];
        const maxZIndex = Math.max(0, ...slide.elements.map((e) => e.zIndex));

        const newElement: SlideElement = {
          ...elementData,
          id: elementId,
          zIndex: maxZIndex + 1,
        };

        const updatedSlides = [...pres.slides];
        updatedSlides[slideIndex] = {
          ...slide,
          elements: [...slide.elements, newElement],
        };

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          },
          selectedElementIds: [elementId],
        }));

        return elementId;
      },

      updateElement: (presentationId, slideId, elementId, updates) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        const slideIndex = pres.slides.findIndex((s) => s.id === slideId);
        if (slideIndex === -1) return;

        const slide = pres.slides[slideIndex];
        const elementIndex = slide.elements.findIndex(
          (e) => e.id === elementId
        );
        if (elementIndex === -1) return;

        const updatedElements = [...slide.elements];
        updatedElements[elementIndex] = {
          ...updatedElements[elementIndex],
          ...updates,
        };

        const updatedSlides = [...pres.slides];
        updatedSlides[slideIndex] = {
          ...slide,
          elements: updatedElements,
        };

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      deleteElement: (presentationId, slideId, elementId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        get().saveToHistory();

        const slideIndex = pres.slides.findIndex((s) => s.id === slideId);
        if (slideIndex === -1) return;

        const slide = pres.slides[slideIndex];
        const updatedSlides = [...pres.slides];
        updatedSlides[slideIndex] = {
          ...slide,
          elements: slide.elements.filter((e) => e.id !== elementId),
        };

        set((state) => ({
          presentations: {
            ...state.presentations,
            [presentationId]: {
              ...pres,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          },
          selectedElementIds: state.selectedElementIds.filter(
            (id) => id !== elementId
          ),
        }));
      },

      deleteSelectedElements: () => {
        const state = get();
        if (!state.currentPresentationId || !state.selectedSlideId) return;
        if (state.selectedElementIds.length === 0) return;

        get().saveToHistory();

        const pres = state.presentations[state.currentPresentationId];
        if (!pres) return;

        const slideIndex = pres.slides.findIndex(
          (s) => s.id === state.selectedSlideId
        );
        if (slideIndex === -1) return;

        const slide = pres.slides[slideIndex];
        const selectedSet = new Set(state.selectedElementIds);

        const updatedSlides = [...pres.slides];
        updatedSlides[slideIndex] = {
          ...slide,
          elements: slide.elements.filter((e) => !selectedSet.has(e.id)),
        };

        set((prevState) => ({
          presentations: {
            ...prevState.presentations,
            [state.currentPresentationId!]: {
              ...pres,
              slides: updatedSlides,
              updatedAt: Date.now(),
            },
          },
          selectedElementIds: [],
        }));
      },

      setSelectedElements: (elementIds) => {
        set({ selectedElementIds: elementIds });
      },

      addToSelection: (elementId) => {
        set((state) => ({
          selectedElementIds: state.selectedElementIds.includes(elementId)
            ? state.selectedElementIds
            : [...state.selectedElementIds, elementId],
        }));
      },

      removeFromSelection: (elementId) => {
        set((state) => ({
          selectedElementIds: state.selectedElementIds.filter(
            (id) => id !== elementId
          ),
        }));
      },

      clearSelection: () => {
        set({ selectedElementIds: [] });
      },

      // Element positioning
      moveElement: (presentationId, slideId, elementId, position) => {
        get().updateElement(presentationId, slideId, elementId, { position });
      },

      resizeElement: (presentationId, slideId, elementId, size) => {
        get().updateElement(presentationId, slideId, elementId, { size });
      },

      bringToFront: (presentationId, slideId, elementId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        const slide = pres.slides.find((s) => s.id === slideId);
        if (!slide) return;

        const maxZIndex = Math.max(...slide.elements.map((e) => e.zIndex));
        get().updateElement(presentationId, slideId, elementId, {
          zIndex: maxZIndex + 1,
        });
      },

      sendToBack: (presentationId, slideId, elementId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        const slide = pres.slides.find((s) => s.id === slideId);
        if (!slide) return;

        const minZIndex = Math.min(...slide.elements.map((e) => e.zIndex));
        get().updateElement(presentationId, slideId, elementId, {
          zIndex: minZIndex - 1,
        });
      },

      bringForward: (presentationId, slideId, elementId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        const slide = pres.slides.find((s) => s.id === slideId);
        if (!slide) return;

        const element = slide.elements.find((e) => e.id === elementId);
        if (!element) return;

        get().updateElement(presentationId, slideId, elementId, {
          zIndex: element.zIndex + 1,
        });
      },

      sendBackward: (presentationId, slideId, elementId) => {
        const state = get();
        const pres = state.presentations[presentationId];
        if (!pres) return;

        const slide = pres.slides.find((s) => s.id === slideId);
        if (!slide) return;

        const element = slide.elements.find((e) => e.id === elementId);
        if (!element) return;

        get().updateElement(presentationId, slideId, elementId, {
          zIndex: Math.max(0, element.zIndex - 1),
        });
      },

      // Clipboard
      copyElements: () => {
        const state = get();
        if (!state.currentPresentationId || !state.selectedSlideId) return;
        if (state.selectedElementIds.length === 0) return;

        const pres = state.presentations[state.currentPresentationId];
        if (!pres) return;

        const slide = pres.slides.find((s) => s.id === state.selectedSlideId);
        if (!slide) return;

        const selectedSet = new Set(state.selectedElementIds);
        const copiedElements = slide.elements.filter((e) =>
          selectedSet.has(e.id)
        );

        set({ clipboard: copiedElements });
      },

      cutElements: () => {
        get().copyElements();
        get().deleteSelectedElements();
      },

      pasteElements: () => {
        const state = get();
        if (!state.currentPresentationId || !state.selectedSlideId) return;
        if (!state.clipboard || state.clipboard.length === 0) return;

        const newElementIds: string[] = [];

        for (const element of state.clipboard) {
          const newId = get().addElement(
            state.currentPresentationId,
            state.selectedSlideId,
            {
              ...element,
              position: {
                x: element.position.x + 20,
                y: element.position.y + 20,
              },
            }
          );
          if (newId) newElementIds.push(newId);
        }

        set({ selectedElementIds: newElementIds });
      },

      // Theme
      setTheme: (presentationId, theme) => {
        get().saveToHistory();
        get().updatePresentation(presentationId, { theme });
      },

      // Preview mode
      enterPreviewMode: () => {
        const state = get();
        const slideIndex = state.currentPresentationId
          ? (state.presentations[state.currentPresentationId]?.slides.findIndex(
              (s) => s.id === state.selectedSlideId
            ) ?? 0)
          : 0;

        set({
          isPreviewMode: true,
          previewSlideIndex: Math.max(0, slideIndex),
        });
      },

      exitPreviewMode: () => {
        set({ isPreviewMode: false });
      },

      nextPreviewSlide: () => {
        const state = get();
        const pres = state.currentPresentationId
          ? state.presentations[state.currentPresentationId]
          : null;
        if (!pres) return;

        set({
          previewSlideIndex: Math.min(
            state.previewSlideIndex + 1,
            pres.slides.length - 1
          ),
        });
      },

      previousPreviewSlide: () => {
        set((state) => ({
          previewSlideIndex: Math.max(state.previewSlideIndex - 1, 0),
        }));
      },

      goToPreviewSlide: (index) => {
        const state = get();
        const pres = state.currentPresentationId
          ? state.presentations[state.currentPresentationId]
          : null;
        if (!pres) return;

        set({
          previewSlideIndex: Math.max(
            0,
            Math.min(index, pres.slides.length - 1)
          ),
        });
      },

      // Undo/Redo
      saveToHistory: () => {
        const state = get();
        if (!state.currentPresentationId) return;

        const pres = state.presentations[state.currentPresentationId];
        if (!pres) return;

        const history = state.history[state.currentPresentationId] || {
          past: [],
          future: [],
        };

        // Deep clone current state
        const snapshot = JSON.parse(JSON.stringify(pres));

        const newPast = [...history.past, snapshot].slice(-MAX_HISTORY_SIZE);

        set((prevState) => ({
          history: {
            ...prevState.history,
            [state.currentPresentationId!]: {
              past: newPast,
              future: [], // Clear future on new action
            },
          },
        }));
      },

      undo: () => {
        const state = get();
        if (!state.currentPresentationId) return;

        const history = state.history[state.currentPresentationId];
        if (!history || history.past.length === 0) return;

        const currentPres = state.presentations[state.currentPresentationId];
        const previousState = history.past[history.past.length - 1];

        set((prevState) => ({
          presentations: {
            ...prevState.presentations,
            [state.currentPresentationId!]: previousState,
          },
          history: {
            ...prevState.history,
            [state.currentPresentationId!]: {
              past: history.past.slice(0, -1),
              future: [currentPres, ...history.future].slice(
                0,
                MAX_HISTORY_SIZE
              ),
            },
          },
        }));
      },

      redo: () => {
        const state = get();
        if (!state.currentPresentationId) return;

        const history = state.history[state.currentPresentationId];
        if (!history || history.future.length === 0) return;

        const currentPres = state.presentations[state.currentPresentationId];
        const nextState = history.future[0];

        set((prevState) => ({
          presentations: {
            ...prevState.presentations,
            [state.currentPresentationId!]: nextState,
          },
          history: {
            ...prevState.history,
            [state.currentPresentationId!]: {
              past: [...history.past, currentPres].slice(-MAX_HISTORY_SIZE),
              future: history.future.slice(1),
            },
          },
        }));
      },

      canUndo: () => {
        const state = get();
        if (!state.currentPresentationId) return false;
        const history = state.history[state.currentPresentationId];
        return history ? history.past.length > 0 : false;
      },

      canRedo: () => {
        const state = get();
        if (!state.currentPresentationId) return false;
        const history = state.history[state.currentPresentationId];
        return history ? history.future.length > 0 : false;
      },

      // UI controls
      setZoom: (zoom) => {
        set({ zoom: Math.max(25, Math.min(200, zoom)) });
      },

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleNotes: () => {
        set((state) => ({ showNotes: !state.showNotes }));
      },

      setEditing: (editing) => {
        set({ isEditing: editing });
      },

      // Getters
      getCurrentPresentation: () => {
        const state = get();
        return state.currentPresentationId
          ? state.presentations[state.currentPresentationId] || null
          : null;
      },

      getSelectedSlide: () => {
        const state = get();
        const pres = get().getCurrentPresentation();
        if (!pres || !state.selectedSlideId) return null;
        return pres.slides.find((s) => s.id === state.selectedSlideId) || null;
      },

      getPresentationById: (id) => {
        return get().presentations[id] || null;
      },

      getAllPresentations: () => {
        return Object.values(get().presentations).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      // Generation
      setGenerating: (isGenerating, progress = 0) => {
        set({ isGenerating, generationProgress: progress });
      },

      // Bulk operations
      importPresentation: (presentation) => {
        const newId = nanoid();
        const now = Date.now();

        // Deep clone with new IDs
        const newSlides = presentation.slides.map((slide) => ({
          ...slide,
          id: nanoid(),
          elements: slide.elements.map((el) => ({
            ...el,
            id: nanoid(),
          })),
        }));

        const newPresentation: Presentation = {
          ...presentation,
          id: newId,
          slides: newSlides,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          presentations: { ...state.presentations, [newId]: newPresentation },
          history: {
            ...state.history,
            [newId]: { past: [], future: [] },
          },
        }));

        return newId;
      },

      exportPresentation: (presentationId) => {
        return get().presentations[presentationId] || null;
      },

      clearAllData: () => {
        set({
          presentations: {},
          currentPresentationId: null,
          selectedSlideId: null,
          selectedElementIds: [],
          isEditing: false,
          isPreviewMode: false,
          history: {},
        });
      },
    }),
    {
      name: "ppt-storage",
      partialize: (state) => ({
        presentations: state.presentations,
      }),
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get current editing state
 */
export function usePPTEditor() {
  const {
    getCurrentPresentation,
    getSelectedSlide,
    selectedElementIds,
    isEditing,
    zoom,
    showGrid,
    showNotes,
    addElement,
    updateElement,
    deleteSelectedElements,
    setSelectedElements,
    copyElements,
    cutElements,
    pasteElements,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
  } = usePPTStore();

  const presentation = getCurrentPresentation();
  const selectedSlide = getSelectedSlide();

  return {
    presentation,
    selectedSlide,
    selectedElementIds,
    isEditing,
    zoom,
    showGrid,
    showNotes,
    canUndo: canUndo(),
    canRedo: canRedo(),
    actions: {
      addElement: (element: Omit<SlideElement, "id">) => {
        if (presentation && selectedSlide) {
          return addElement(presentation.id, selectedSlide.id, element);
        }
        return "";
      },
      updateElement: (
        elementId: string,
        updates: Partial<Omit<SlideElement, "id">>
      ) => {
        if (presentation && selectedSlide) {
          updateElement(presentation.id, selectedSlide.id, elementId, updates);
        }
      },
      deleteSelected: deleteSelectedElements,
      setSelection: setSelectedElements,
      copy: copyElements,
      cut: cutElements,
      paste: pasteElements,
      undo,
      redo,
      setZoom,
    },
  };
}

/**
 * Hook for preview mode
 */
export function usePPTPreview() {
  const {
    getCurrentPresentation,
    isPreviewMode,
    previewSlideIndex,
    enterPreviewMode,
    exitPreviewMode,
    nextPreviewSlide,
    previousPreviewSlide,
    goToPreviewSlide,
  } = usePPTStore();

  const presentation = getCurrentPresentation();
  const currentSlide = presentation?.slides[previewSlideIndex] ?? null;
  const totalSlides = presentation?.slides.length ?? 0;

  return {
    isPreviewMode,
    currentSlide,
    currentIndex: previewSlideIndex,
    totalSlides,
    hasNext: previewSlideIndex < totalSlides - 1,
    hasPrevious: previewSlideIndex > 0,
    actions: {
      enter: enterPreviewMode,
      exit: exitPreviewMode,
      next: nextPreviewSlide,
      previous: previousPreviewSlide,
      goTo: goToPreviewSlide,
    },
  };
}
