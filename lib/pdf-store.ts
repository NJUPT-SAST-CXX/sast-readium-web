import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";

export interface PDFMetadata {
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    [key: string]: unknown;
  };
  metadata?: unknown;
  contentLength?: number; // File size
  fileCreatedAt?: string;
  fileModifiedAt?: string;
}

export interface RecentFile {
  name: string;
  url: string;
  lastOpened: number;
  numPages?: number;
  path?: string | null;
  readingProgress?: number;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
}

export interface Annotation {
  id: string;
  type: "highlight" | "comment" | "shape" | "text" | "drawing" | "image";
  pageNumber: number;
  content?: string;
  color: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  // For drawing annotations
  path?: Array<{ x: number; y: number }>;
  strokeWidth?: number;
  timestamp: number;
}

export interface AnnotationHistory {
  past: Annotation[][];
  present: Annotation[];
  future: Annotation[][];
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  timestamp: number;
}

interface DocumentStateSnapshot {
  numPages: number;
  currentPage: number;
  zoom: number;
  rotation: number;
  viewMode: ViewMode;
  fitMode: FitMode;
  isFullscreen: boolean;
  showThumbnails: boolean;
  showOutline: boolean;
  showAnnotations: boolean;
  isDarkMode: boolean;
  themeMode: "light" | "dark" | "sepia" | "auto";
  isPresentationMode: boolean;
  showKeyboardShortcuts: boolean;
  showPageNavigationInBottomBar: boolean;
  outline: PDFOutlineNode[];
  metadata: PDFMetadata | null;
  // TTS State
  isReading: boolean;
  speechRate: number;
  speechVolume: number;
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  caseSensitiveSearch: boolean;
  annotations: Annotation[];
  annotationHistory: AnnotationHistory;
  selectedAnnotationColor: string;
  selectedStrokeWidth: number;
  bookmarks: Bookmark[];
  readingProgress: number;
  pageOrder: number[];
  pageRotations: Record<number, number>;
  pdfUrl: string | null;
  isSelectionMode: boolean;
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkSize: number;
  watermarkGapX: number;
  watermarkGapY: number;
  watermarkRotation: number;

  // Scrolling & Interaction
  scrollSensitivity: number;
  scrollThreshold: number;
  scrollDebounce: number;
  enableSmoothScrolling: boolean;
  invertWheel: boolean;
  zoomStep: number;
  sidebarInitialWidth: number;
}

export interface PDFOutlineNode {
  title: string;
  bold?: boolean;
  italic?: boolean;
  color?: number[];
  dest?: string | unknown[];
  url?: string;
  items?: PDFOutlineNode[];
  pageNumber?: number;
}

export type ViewMode = "single" | "continuous" | "twoPage";
export type FitMode = "custom" | "fitWidth" | "fitPage";
export type AnnotationStamp =
  | "approved"
  | "rejected"
  | "confidential"
  | "draft"
  | "final"
  | "reviewed";

interface PDFState {
  // Current PDF state
  currentPDF: File | null;
  pdfUrl: string | null;
  numPages: number;
  currentPage: number;
  zoom: number;
  rotation: number;

  // View modes
  viewMode: ViewMode;
  fitMode: FitMode;

  // UI state
  isFullscreen: boolean;
  showThumbnails: boolean;
  showOutline: boolean;
  showAnnotations: boolean;
  isDarkMode: boolean;
  isPresentationMode: boolean;
  showKeyboardShortcuts: boolean;
  showPageNavigationInBottomBar: boolean;

  // Theme mode
  themeMode: "light" | "dark" | "sepia" | "auto";

  // Outline/Bookmarks
  outline: PDFOutlineNode[];

  // Metadata
  metadata: PDFMetadata | null;

  // TTS State
  isReading: boolean;
  speechRate: number;
  speechVolume: number;

  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  caseSensitiveSearch: boolean;

  // Annotations
  annotations: Annotation[];
  annotationHistory: AnnotationHistory;
  selectedAnnotationColor: string;
  selectedStrokeWidth: number;

  // Bookmarks
  bookmarks: Bookmark[];

  // Recent files
  recentFiles: RecentFile[];

  // Signatures
  signatures: string[];

  // Reading progress
  readingProgress: number; // 0-100 percentage

  // Multi-document sessions
  activeDocumentId: string | null;
  documents: Record<string, DocumentStateSnapshot>;

  // Menu bar state
  showMenuBar: boolean;

  // Selection mode state
  isSelectionMode: boolean;

  // Page order for drag-and-drop reordering
  pageOrder: number[]; // Array of page indices in display order

  // Per-page rotation (in addition to global rotation)
  pageRotations: Record<number, number>; // originalPageNumber -> rotation (0, 90, 180, 270)

  // Watermark settings
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkSize: number;
  watermarkGapX: number;
  watermarkGapY: number;
  watermarkRotation: number;

  setWatermarkText: (text: string) => void;
  setWatermarkColor: (color: string) => void;
  setWatermarkOpacity: (opacity: number) => void;
  setWatermarkSize: (size: number) => void;
  setWatermarkGapX: (gap: number) => void;
  setWatermarkGapY: (gap: number) => void;
  setWatermarkRotation: (rotation: number) => void;

  // Scrolling & Interaction
  scrollSensitivity: number;
  scrollThreshold: number;
  scrollDebounce: number;
  enableSmoothScrolling: boolean;
  invertWheel: boolean;
  zoomStep: number;
  sidebarInitialWidth: number;

  setScrollSensitivity: (val: number) => void;
  setScrollThreshold: (val: number) => void;
  setScrollDebounce: (val: number) => void;
  setEnableSmoothScrolling: (val: boolean) => void;
  setInvertWheel: (val: boolean) => void;
  setZoomStep: (val: number) => void;
  setSidebarInitialWidth: (val: number) => void;

  // App Settings
  enableSplashScreen: boolean;
  pdfLoadingAnimation: "spinner" | "pulse" | "bar";
  autoCheckUpdate: boolean;

  // Actions
  setCurrentPDF: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setNumPages: (numPages: number) => void;
  setCurrentPage: (page: number) => void;
  removePage: (pageIndex: number) => void; // Removes page at specific visual index
  rotatePage: (pageNumber: number) => void; // Rotates specific original page number
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  firstPage: () => void;
  lastPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewMode: (mode: ViewMode) => void;
  setFitMode: (mode: FitMode) => void;
  setRotation: (rotation: number) => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  toggleFullscreen: () => void;
  toggleThumbnails: () => void;
  toggleOutline: () => void;
  toggleAnnotations: () => void;
  toggleDarkMode: () => void;
  setThemeMode: (mode: "light" | "dark" | "sepia" | "auto") => void;
  togglePresentationMode: () => void;

  // TTS Actions
  setIsReading: (isReading: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSpeechVolume: (volume: number) => void;

  toggleKeyboardShortcuts: () => void;
  toggleBottomBarMode: () => void;
  setOutline: (outline: PDFOutlineNode[]) => void;
  setMetadata: (metadata: PDFMetadata | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  toggleCaseSensitiveSearch: () => void;
  addAnnotation: (annotation: Omit<Annotation, "id" | "timestamp">) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  undoAnnotation: () => void;
  redoAnnotation: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setSelectedAnnotationColor: (color: string) => void;
  setSelectedStrokeWidth: (width: number) => void;
  addStampAnnotation: (
    stamp: AnnotationStamp,
    pageNumber: number,
    position: { x: number; y: number }
  ) => void;
  addImageAnnotation: (
    imageUrl: string,
    pageNumber: number,
    position: { x: number; y: number; width: number; height: number }
  ) => void;
  addSignature: (signature: string) => void;
  removeSignature: (index: number) => void;
  exportAnnotations: () => string;
  importAnnotations: (data: string) => void;
  addBookmark: (pageNumber: number, title: string) => void;
  removeBookmark: (id: string) => void;
  addRecentFile: (file: RecentFile) => void;
  removeRecentFile: (url: string) => void;
  clearRecentFiles: () => void;
  updateRecentFileByPath: (
    oldPath: string,
    updates: { name?: string; path?: string | null }
  ) => void;
  updateRecentFileByUrl: (
    url: string,
    updates: { readingProgress?: number; lastOpened?: number }
  ) => void;
  updateReadingProgress: (progress: number) => void;
  resetPDF: () => void;
  openDocumentSession: (id: string) => void;
  closeDocumentSession: (id: string) => void;
  toggleMenuBar: () => void;
  toggleSelectionMode: () => void;
  reorderPages: (newOrder: number[]) => void;
  initializePageOrder: (numPages: number) => void;
  toggleSplashScreen: () => void;
  setPdfLoadingAnimation: (animation: "spinner" | "pulse" | "bar") => void;
  toggleAutoCheckUpdate: () => void;
}

const createSnapshotFromState = (state: PDFState): DocumentStateSnapshot => ({
  numPages: state.numPages,
  currentPage: state.currentPage,
  zoom: state.zoom,
  rotation: state.rotation,
  viewMode: state.viewMode,
  fitMode: state.fitMode,
  isFullscreen: state.isFullscreen,
  showThumbnails: state.showThumbnails,
  showOutline: state.showOutline,
  showAnnotations: state.showAnnotations,
  isDarkMode: state.isDarkMode,
  themeMode: state.themeMode,
  isPresentationMode: state.isPresentationMode,
  showKeyboardShortcuts: state.showKeyboardShortcuts,
  showPageNavigationInBottomBar: state.showPageNavigationInBottomBar,
  outline: state.outline,
  metadata: state.metadata,
  isReading: state.isReading,
  speechRate: state.speechRate,
  speechVolume: state.speechVolume,
  searchQuery: state.searchQuery,
  searchResults: state.searchResults,
  currentSearchIndex: state.currentSearchIndex,
  caseSensitiveSearch: state.caseSensitiveSearch,
  annotations: state.annotations,
  annotationHistory: state.annotationHistory,
  selectedAnnotationColor: state.selectedAnnotationColor,
  selectedStrokeWidth: state.selectedStrokeWidth,
  bookmarks: state.bookmarks,
  readingProgress: state.readingProgress,
  pageOrder: state.pageOrder,
  pageRotations: state.pageRotations || {}, // Add this
  pdfUrl: state.pdfUrl,
  isSelectionMode: state.isSelectionMode,
  watermarkText: state.watermarkText,
  watermarkColor: state.watermarkColor,
  watermarkOpacity: state.watermarkOpacity,
  watermarkSize: state.watermarkSize,
  watermarkGapX: state.watermarkGapX,
  watermarkGapY: state.watermarkGapY,
  watermarkRotation: state.watermarkRotation,
  scrollSensitivity: state.scrollSensitivity,
  scrollThreshold: state.scrollThreshold,
  scrollDebounce: state.scrollDebounce,
  enableSmoothScrolling: state.enableSmoothScrolling,
  invertWheel: state.invertWheel,
  zoomStep: state.zoomStep,
  sidebarInitialWidth: state.sidebarInitialWidth,
});

export const usePDFStore = create<PDFState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPDF: null,
      pdfUrl: null,
      numPages: 0,
      currentPage: 1,
      zoom: 1.0,
      rotation: 0,
      viewMode: "single" as ViewMode,
      fitMode: "custom" as FitMode,
      isFullscreen: false,
      showThumbnails: false,
      showOutline: false,
      showAnnotations: false,
      isDarkMode: false,
      themeMode: "auto",
      isPresentationMode: false,
      showKeyboardShortcuts: false,
      showPageNavigationInBottomBar: true,

      // TTS Initial State
      isReading: false,
      speechRate: 1.0,
      speechVolume: 1.0,

      outline: [],
      metadata: null,
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: 0,
      caseSensitiveSearch: false,
      annotations: [],
      annotationHistory: {
        past: [],
        present: [],
        future: [],
      },
      selectedAnnotationColor: "#ffff00",
      selectedStrokeWidth: 2,
      bookmarks: [],
      signatures: [],
      recentFiles: [],
      readingProgress: 0,
      activeDocumentId: null,
      documents: {},
      showMenuBar: true,
      isSelectionMode: false,
      pageOrder: [],
      pageRotations: {},
      enableSplashScreen: true,
      pdfLoadingAnimation: "spinner",
      autoCheckUpdate: false,

      watermarkText: "",
      watermarkColor: "rgba(0, 0, 0, 0.1)",
      watermarkOpacity: 0.2,
      watermarkSize: 48,
      watermarkGapX: 1.5,
      watermarkGapY: 4,
      watermarkRotation: -45,

      // Scrolling & Interaction Defaults
      scrollSensitivity: 150,
      scrollThreshold: 10,
      scrollDebounce: 150,
      enableSmoothScrolling: true,
      invertWheel: false,
      zoomStep: 0.1,
      sidebarInitialWidth: 240,

      // Actions
      setCurrentPDF: (file) => set({ currentPDF: file }),

      setWatermarkText: (text: string) => set({ watermarkText: text }),
      setWatermarkColor: (color: string) => set({ watermarkColor: color }),
      setWatermarkOpacity: (opacity: number) =>
        set({ watermarkOpacity: opacity }),
      setWatermarkSize: (size: number) => set({ watermarkSize: size }),
      setWatermarkGapX: (gap: number) => set({ watermarkGapX: gap }),
      setWatermarkGapY: (gap: number) => set({ watermarkGapY: gap }),
      setWatermarkRotation: (rotation: number) =>
        set({ watermarkRotation: rotation }),
      setScrollSensitivity: (val) => set({ scrollSensitivity: val }),
      setScrollThreshold: (val) => set({ scrollThreshold: val }),
      setScrollDebounce: (val) => set({ scrollDebounce: val }),
      setEnableSmoothScrolling: (val) => set({ enableSmoothScrolling: val }),
      setInvertWheel: (val) => set({ invertWheel: val }),
      setZoomStep: (val) => set({ zoomStep: val }),
      setSidebarInitialWidth: (val) => set({ sidebarInitialWidth: val }),

      setPdfUrl: (url) => set({ pdfUrl: url }),

      toggleSplashScreen: () =>
        set((state) => ({ enableSplashScreen: !state.enableSplashScreen })),

      toggleAutoCheckUpdate: () =>
        set((state) => ({ autoCheckUpdate: !state.autoCheckUpdate })),

      setPdfLoadingAnimation: (animation: "spinner" | "pulse" | "bar") =>
        set({ pdfLoadingAnimation: animation }),

      setNumPages: (numPages) => set({ numPages }),

      setCurrentPage: (page) => {
        const { pageOrder, numPages } = get();
        // If pageOrder is used, we check against pageOrder length, otherwise numPages
        const max = pageOrder.length > 0 ? pageOrder.length : numPages;
        if (page >= 1 && page <= max) {
          set({ currentPage: page });
        }
      },

      removePage: (visualIndex) => {
        set((state) => {
          const newPageOrder = [
            ...(state.pageOrder.length > 0
              ? state.pageOrder
              : Array.from({ length: state.numPages }, (_, i) => i + 1)),
          ];
          if (visualIndex >= 0 && visualIndex < newPageOrder.length) {
            newPageOrder.splice(visualIndex, 1);

            // Adjust current page if needed
            let newCurrentPage = state.currentPage;
            if (newCurrentPage > newPageOrder.length) {
              newCurrentPage = Math.max(1, newPageOrder.length);
            } else if (state.currentPage > visualIndex + 1) {
              // If we deleted a page before current page, shift current page back
              newCurrentPage--;
            } else if (state.currentPage === visualIndex + 1) {
              // If we deleted current page, stay at same index (which is now next page) or go to last
              newCurrentPage = Math.min(state.currentPage, newPageOrder.length);
            }

            return { pageOrder: newPageOrder, currentPage: newCurrentPage };
          }
          return state;
        });
      },

      rotatePage: (pageNumber) => {
        set((state) => {
          const currentRotation = state.pageRotations[pageNumber] || 0;
          return {
            pageRotations: {
              ...state.pageRotations,
              [pageNumber]: (currentRotation + 90) % 360,
            },
          };
        });
      },

      nextPage: () => {
        const { currentPage, numPages, pageOrder } = get();
        const max = pageOrder.length > 0 ? pageOrder.length : numPages;
        if (currentPage < max) {
          set({ currentPage: currentPage + 1 });
        }
      },

      previousPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 });
        }
      },

      goToPage: (page) => {
        const { numPages, pageOrder } = get();
        const max = pageOrder.length > 0 ? pageOrder.length : numPages;
        if (page >= 1 && page <= max) {
          set({ currentPage: page });
        }
      },

      firstPage: () => {
        set({ currentPage: 1 });
      },

      lastPage: () => {
        const { numPages, pageOrder } = get();
        const max = pageOrder.length > 0 ? pageOrder.length : numPages;
        set({ currentPage: max });
      },

      setZoom: (zoom) => {
        // Zoom limits: 50% to 300%
        if (zoom >= 0.5 && zoom <= 3.0) {
          set({ zoom, fitMode: "custom" });
        }
      },

      zoomIn: () => {
        const { zoom } = get();
        // Increment by 0.25 (25%) with max of 300%
        const newZoom = Math.min(zoom + 0.25, 3.0);
        set({ zoom: newZoom, fitMode: "custom" });
      },

      zoomOut: () => {
        const { zoom } = get();
        // Decrement by 0.25 (25%) with min of 50%
        const newZoom = Math.max(zoom - 0.25, 0.5);
        set({ zoom: newZoom, fitMode: "custom" });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setFitMode: (mode) => set({ fitMode: mode }),

      setRotation: (rotation) => set({ rotation: rotation % 360 }),

      rotateClockwise: () => {
        const { rotation } = get();
        set({ rotation: (rotation + 90) % 360 });
      },

      rotateCounterClockwise: () => {
        const { rotation } = get();
        set({ rotation: (rotation - 90 + 360) % 360 });
      },

      toggleFullscreen: () =>
        set((state) => ({ isFullscreen: !state.isFullscreen })),

      toggleThumbnails: () =>
        set((state) => ({ showThumbnails: !state.showThumbnails })),

      toggleOutline: () =>
        set((state) => ({ showOutline: !state.showOutline })),

      toggleAnnotations: () =>
        set((state) => ({ showAnnotations: !state.showAnnotations })),

      toggleDarkMode: () =>
        set((state) => {
          const newIsDarkMode = !state.isDarkMode;
          return {
            isDarkMode: newIsDarkMode,
            themeMode: newIsDarkMode ? "dark" : "light", // Manual toggle sets explicit mode
          };
        }),

      setThemeMode: (mode) =>
        set((state) => {
          let newIsDarkMode = state.isDarkMode;

          if (mode === "light" || mode === "sepia") newIsDarkMode = false;
          if (mode === "dark") newIsDarkMode = true;

          return { themeMode: mode, isDarkMode: newIsDarkMode };
        }),

      setIsReading: (isReading) => set({ isReading }),
      setSpeechRate: (rate) => set({ speechRate: rate }),
      setSpeechVolume: (volume) => set({ speechVolume: volume }),

      togglePresentationMode: () =>
        set((state) => ({ isPresentationMode: !state.isPresentationMode })),

      toggleKeyboardShortcuts: () =>
        set((state) => ({
          showKeyboardShortcuts: !state.showKeyboardShortcuts,
        })),

      toggleBottomBarMode: () =>
        set((state) => ({
          showPageNavigationInBottomBar: !state.showPageNavigationInBottomBar,
        })),

      setOutline: (outline) => set({ outline }),

      setMetadata: (metadata) => set({ metadata }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSearchResults: (results) =>
        set({ searchResults: results, currentSearchIndex: 0 }),

      nextSearchResult: () => {
        const { currentSearchIndex, searchResults, pageOrder } = get();
        if (searchResults.length > 0) {
          const newIndex = (currentSearchIndex + 1) % searchResults.length;
          const originalPage = searchResults[newIndex].pageNumber;
          let visualPage = originalPage;

          // Map original page to visual page if reordered
          if (pageOrder.length > 0) {
            const index = pageOrder.indexOf(originalPage);
            if (index !== -1) {
              visualPage = index + 1;
            }
          }

          set({ currentSearchIndex: newIndex, currentPage: visualPage });
        }
      },

      previousSearchResult: () => {
        const { currentSearchIndex, searchResults, pageOrder } = get();
        if (searchResults.length > 0) {
          const newIndex =
            (currentSearchIndex - 1 + searchResults.length) %
            searchResults.length;
          const originalPage = searchResults[newIndex].pageNumber;
          let visualPage = originalPage;

          // Map original page to visual page if reordered
          if (pageOrder.length > 0) {
            const index = pageOrder.indexOf(originalPage);
            if (index !== -1) {
              visualPage = index + 1;
            }
          }

          set({ currentSearchIndex: newIndex, currentPage: visualPage });
        }
      },

      toggleCaseSensitiveSearch: () =>
        set((state) => ({ caseSensitiveSearch: !state.caseSensitiveSearch })),

      addAnnotation: (annotation) => {
        const newAnnotation: Annotation = {
          ...annotation,
          id: `annotation-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
          annotationHistory: {
            past: [
              ...state.annotationHistory.past,
              state.annotationHistory.present,
            ],
            present: [...state.annotations, newAnnotation],
            future: [], // Clear redo stack
          },
        }));
      },

      removeAnnotation: (id) => {
        set((state) => {
          const newAnnotations = state.annotations.filter((a) => a.id !== id);
          return {
            annotations: newAnnotations,
            annotationHistory: {
              past: [
                ...state.annotationHistory.past,
                state.annotationHistory.present,
              ],
              present: newAnnotations,
              future: [], // Clear redo stack
            },
          };
        });
      },

      updateAnnotation: (id, updates) => {
        set((state) => {
          const newAnnotations = state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          );
          return {
            annotations: newAnnotations,
            annotationHistory: {
              past: [
                ...state.annotationHistory.past,
                state.annotationHistory.present,
              ],
              present: newAnnotations,
              future: [], // Clear redo stack
            },
          };
        });
      },

      undoAnnotation: () => {
        set((state) => {
          if (state.annotationHistory.past.length === 0) return state;

          const previous =
            state.annotationHistory.past[
              state.annotationHistory.past.length - 1
            ];
          const newPast = state.annotationHistory.past.slice(0, -1);

          return {
            annotations: previous,
            annotationHistory: {
              past: newPast,
              present: previous,
              future: [
                state.annotationHistory.present,
                ...state.annotationHistory.future,
              ],
            },
          };
        });
      },

      redoAnnotation: () => {
        set((state) => {
          if (state.annotationHistory.future.length === 0) return state;

          const next = state.annotationHistory.future[0];
          const newFuture = state.annotationHistory.future.slice(1);

          return {
            annotations: next,
            annotationHistory: {
              past: [
                ...state.annotationHistory.past,
                state.annotationHistory.present,
              ],
              present: next,
              future: newFuture,
            },
          };
        });
      },

      canUndo: () => {
        const state = get();
        return state.annotationHistory.past.length > 0;
      },

      canRedo: () => {
        const state = get();
        return state.annotationHistory.future.length > 0;
      },

      setSelectedAnnotationColor: (color) =>
        set({ selectedAnnotationColor: color }),

      setSelectedStrokeWidth: (width) => set({ selectedStrokeWidth: width }),

      addStampAnnotation: (stamp, pageNumber, position) => {
        const stampTexts: Record<AnnotationStamp, string> = {
          approved: "✓ APPROVED",
          rejected: "✗ REJECTED",
          confidential: "🔒 CONFIDENTIAL",
          draft: "📝 DRAFT",
          final: "✓ FINAL",
          reviewed: "👁 REVIEWED",
        };

        const stampColors: Record<AnnotationStamp, string> = {
          approved: "#22c55e",
          rejected: "#ef4444",
          confidential: "#f59e0b",
          draft: "#6366f1",
          final: "#10b981",
          reviewed: "#3b82f6",
        };

        const newAnnotation: Annotation = {
          id: `stamp-${Date.now()}-${Math.random()}`,
          type: "text",
          pageNumber,
          content: stampTexts[stamp],
          color: stampColors[stamp],
          position,
          timestamp: Date.now(),
        };

        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
          annotationHistory: {
            past: [
              ...state.annotationHistory.past,
              state.annotationHistory.present,
            ],
            present: [...state.annotations, newAnnotation],
            future: [],
          },
        }));
      },

      addImageAnnotation: (
        imageUrl: string,
        pageNumber: number,
        position: { x: number; y: number; width: number; height: number }
      ) => {
        const newAnnotation: Annotation = {
          id: `image-${Date.now()}-${Math.random()}`,
          type: "image",
          pageNumber,
          content: imageUrl,
          color: "#000000", // Not used for images but required by type
          position,
          timestamp: Date.now(),
        };

        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
          annotationHistory: {
            past: [
              ...state.annotationHistory.past,
              state.annotationHistory.present,
            ],
            present: [...state.annotations, newAnnotation],
            future: [],
          },
        }));
      },

      addSignature: (signature: string) =>
        set((state) => ({ signatures: [...state.signatures, signature] })),

      removeSignature: (index: number) =>
        set((state) => ({
          signatures: state.signatures.filter((_, i) => i !== index),
        })),

      exportAnnotations: () => {
        const state = get();
        const exportData = {
          annotations: state.annotations,
          bookmarks: state.bookmarks,
          exportDate: new Date().toISOString(),
          version: "1.0",
        };
        return JSON.stringify(exportData, null, 2);
      },

      importAnnotations: (data) => {
        try {
          const importData = JSON.parse(data);
          if (importData.annotations && Array.isArray(importData.annotations)) {
            set((state) => ({
              annotations: [...state.annotations, ...importData.annotations],
              bookmarks: importData.bookmarks
                ? [...state.bookmarks, ...importData.bookmarks]
                : state.bookmarks,
              annotationHistory: {
                past: [
                  ...state.annotationHistory.past,
                  state.annotationHistory.present,
                ],
                present: [...state.annotations, ...importData.annotations],
                future: [],
              },
            }));
          }
        } catch (error) {
          console.error("Failed to import annotations:", error);
        }
      },

      addBookmark: (pageNumber, title) => {
        const newBookmark: Bookmark = {
          id: `bookmark-${Date.now()}-${Math.random()}`,
          pageNumber,
          title,
          timestamp: Date.now(),
        };
        set((state) => ({ bookmarks: [...state.bookmarks, newBookmark] }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      updateReadingProgress: (progress) => {
        set({ readingProgress: Math.min(100, Math.max(0, progress)) });
      },

      addRecentFile: (file) => {
        const { recentFiles } = get();
        const filtered = recentFiles.filter((f) => f.url !== file.url);
        const updated = [file, ...filtered].slice(0, 100); // Keep only 10 most recent
        set({ recentFiles: updated });
      },

      removeRecentFile: (url) => {
        set((state) => ({
          recentFiles: state.recentFiles.filter((f) => f.url !== url),
        }));
      },

      clearRecentFiles: () => set({ recentFiles: [] }),

      updateRecentFileByPath: (oldPath, updates) => {
        set((state) => ({
          recentFiles: state.recentFiles.map((f) =>
            f.path === oldPath ? { ...f, ...updates } : f
          ),
        }));
      },

      updateRecentFileByUrl: (url, updates) => {
        set((state) => ({
          recentFiles: state.recentFiles.map((f) =>
            f.url === url ? { ...f, ...updates } : f
          ),
        }));
      },

      resetPDF: () =>
        set({
          currentPDF: null,
          pdfUrl: null,
          numPages: 0,
          currentPage: 1,
          zoom: 1.0,
          rotation: 0,
          viewMode: "single",
          fitMode: "custom",
          isFullscreen: false,
          showThumbnails: false,
          showOutline: false,
          showAnnotations: false,
          outline: [],
          metadata: null,
          searchQuery: "",
          searchResults: [],
          currentSearchIndex: 0,
          caseSensitiveSearch: false,
          annotations: [],
          bookmarks: [],
          readingProgress: 0,
          activeDocumentId: null,
          documents: {},
          watermarkText: "",
          watermarkColor: "rgba(0, 0, 0, 0.1)",
          watermarkOpacity: 0.2,
          watermarkSize: 48,
          watermarkGapX: 1.5,
          watermarkGapY: 4,
          watermarkRotation: -45,
        }),

      openDocumentSession: (id) => {
        set((state) => {
          let documents = state.documents;

          if (state.activeDocumentId) {
            documents = {
              ...documents,
              [state.activeDocumentId]: createSnapshotFromState(state),
            };
          }

          const existing = documents[id];

          const snapshot: DocumentStateSnapshot = existing || {
            numPages: 0,
            currentPage: 1,
            zoom: 1.0,
            rotation: 0,
            viewMode: state.viewMode,
            fitMode: state.fitMode,
            isFullscreen: false,
            showThumbnails: state.showThumbnails,
            showOutline: state.showOutline,
            showAnnotations: state.showAnnotations,
            isDarkMode: state.isDarkMode,
            themeMode: state.themeMode,
            isPresentationMode: state.isPresentationMode,
            showKeyboardShortcuts: state.showKeyboardShortcuts,
            showPageNavigationInBottomBar: true,
            outline: [],
            metadata: null,
            isReading: false,
            speechRate: 1.0,
            speechVolume: 1.0,
            searchQuery: "",
            searchResults: [],
            currentSearchIndex: 0,
            caseSensitiveSearch: state.caseSensitiveSearch,
            annotations: [],
            annotationHistory: {
              past: [],
              present: [],
              future: [],
            },
            selectedAnnotationColor: state.selectedAnnotationColor,
            selectedStrokeWidth: state.selectedStrokeWidth,
            bookmarks: [],
            readingProgress: 0,
            pageOrder: [],
            pdfUrl: null,
          };

          return {
            ...state,
            documents: {
              ...documents,
              [id]: snapshot,
            },
            activeDocumentId: id,
            numPages: snapshot.numPages,
            currentPage: snapshot.currentPage,
            zoom: snapshot.zoom,
            rotation: snapshot.rotation,
            viewMode: snapshot.viewMode,
            fitMode: snapshot.fitMode,
            isFullscreen: snapshot.isFullscreen,
            showThumbnails: snapshot.showThumbnails,
            showOutline: snapshot.showOutline,
            showAnnotations: snapshot.showAnnotations,
            themeMode: snapshot.themeMode,
            isDarkMode: snapshot.isDarkMode,
            isPresentationMode: snapshot.isPresentationMode,
            showKeyboardShortcuts: snapshot.showKeyboardShortcuts,
            showPageNavigationInBottomBar:
              snapshot.showPageNavigationInBottomBar,
            outline: snapshot.outline,
            metadata: snapshot.metadata,
            isReading: snapshot.isReading,
            speechRate: snapshot.speechRate,
            speechVolume: snapshot.speechVolume,
            searchQuery: snapshot.searchQuery,
            searchResults: snapshot.searchResults,
            currentSearchIndex: snapshot.currentSearchIndex,
            caseSensitiveSearch: snapshot.caseSensitiveSearch,
            annotations: snapshot.annotations,
            annotationHistory: snapshot.annotationHistory,
            selectedAnnotationColor: snapshot.selectedAnnotationColor,
            selectedStrokeWidth: snapshot.selectedStrokeWidth,
            bookmarks: snapshot.bookmarks,
            readingProgress: snapshot.readingProgress,
            pageOrder: snapshot.pageOrder,
            pageRotations: snapshot.pageRotations || {},
            pdfUrl: snapshot.pdfUrl,
          };
        });
      },

      closeDocumentSession: (id) => {
        set((state) => {
          const rest = Object.fromEntries(
            Object.entries(state.documents).filter(([key]) => key !== id)
          );

          if (state.activeDocumentId !== id) {
            return {
              ...state,
              documents: rest,
            };
          }

          const remainingIds = Object.keys(rest);

          if (remainingIds.length === 0) {
            return {
              ...state,
              documents: rest,
              activeDocumentId: null,
            };
          }

          const nextId = remainingIds[0];
          const nextSnapshot = rest[nextId];

          return {
            ...state,
            documents: rest,
            activeDocumentId: nextId,
            numPages: nextSnapshot.numPages,
            currentPage: nextSnapshot.currentPage,
            zoom: nextSnapshot.zoom,
            rotation: nextSnapshot.rotation,
            viewMode: nextSnapshot.viewMode,
            fitMode: nextSnapshot.fitMode,
            isFullscreen: nextSnapshot.isFullscreen,
            showThumbnails: nextSnapshot.showThumbnails,
            showOutline: nextSnapshot.showOutline,
            themeMode: nextSnapshot.themeMode,
            showAnnotations: nextSnapshot.showAnnotations,
            isDarkMode: nextSnapshot.isDarkMode,
            isPresentationMode: nextSnapshot.isPresentationMode,
            showKeyboardShortcuts: nextSnapshot.showKeyboardShortcuts,
            showPageNavigationInBottomBar:
              nextSnapshot.showPageNavigationInBottomBar,
            outline: nextSnapshot.outline,
            metadata: nextSnapshot.metadata,
            isReading: nextSnapshot.isReading,
            speechRate: nextSnapshot.speechRate,
            speechVolume: nextSnapshot.speechVolume,
            searchQuery: nextSnapshot.searchQuery,
            searchResults: nextSnapshot.searchResults,
            currentSearchIndex: nextSnapshot.currentSearchIndex,
            caseSensitiveSearch: nextSnapshot.caseSensitiveSearch,
            annotations: nextSnapshot.annotations,
            annotationHistory: nextSnapshot.annotationHistory,
            selectedAnnotationColor: nextSnapshot.selectedAnnotationColor,
            selectedStrokeWidth: nextSnapshot.selectedStrokeWidth,
            bookmarks: nextSnapshot.bookmarks,
            readingProgress: nextSnapshot.readingProgress,
            pageOrder: nextSnapshot.pageOrder,
            pdfUrl: nextSnapshot.pdfUrl,
            watermarkText: nextSnapshot.watermarkText,
            watermarkColor: nextSnapshot.watermarkColor,
            watermarkOpacity: nextSnapshot.watermarkOpacity,
            watermarkSize: nextSnapshot.watermarkSize,
            scrollSensitivity: nextSnapshot.scrollSensitivity,
            scrollThreshold: nextSnapshot.scrollThreshold,
            scrollDebounce: nextSnapshot.scrollDebounce,
            enableSmoothScrolling: nextSnapshot.enableSmoothScrolling,
            invertWheel: nextSnapshot.invertWheel,
            zoomStep: nextSnapshot.zoomStep,
            sidebarInitialWidth: nextSnapshot.sidebarInitialWidth,
          };
        });
      },

      toggleMenuBar: () =>
        set((state) => ({ showMenuBar: !state.showMenuBar })),

      toggleSelectionMode: () =>
        set((state) => ({ isSelectionMode: !state.isSelectionMode })),

      reorderPages: (newOrder) => set({ pageOrder: newOrder }),

      initializePageOrder: (numPages) => {
        set((state) => {
          // Only initialize if pageOrder is empty or doesn't match the number of pages
          if (
            state.pageOrder.length === 0 ||
            state.pageOrder.length !== numPages
          ) {
            const order = Array.from({ length: numPages }, (_, i) => i + 1);
            return { pageOrder: order };
          }
          return state;
        });
      },
    }),
    {
      name: "pdf-reader-storage",
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        isDarkMode: state.isDarkMode,
        themeMode: state.themeMode,
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        // User preferences
        viewMode: state.viewMode,
        fitMode: state.fitMode,
        zoom: state.zoom,
        showThumbnails: state.showThumbnails,
        showOutline: state.showOutline,
        showAnnotations: state.showAnnotations,
        isPresentationMode: state.isPresentationMode,
        showPageNavigationInBottomBar: state.showPageNavigationInBottomBar,
        caseSensitiveSearch: state.caseSensitiveSearch,
        selectedAnnotationColor: state.selectedAnnotationColor,
        selectedStrokeWidth: state.selectedStrokeWidth,
        enableSplashScreen: state.enableSplashScreen,
        pdfLoadingAnimation: state.pdfLoadingAnimation,
        pageRotations: state.pageRotations,
        scrollSensitivity: state.scrollSensitivity,
        scrollThreshold: state.scrollThreshold,
        scrollDebounce: state.scrollDebounce,
        enableSmoothScrolling: state.enableSmoothScrolling,
        invertWheel: state.invertWheel,
        zoomStep: state.zoomStep,
        sidebarInitialWidth: state.sidebarInitialWidth,
      }),
    }
  ) as StateCreator<PDFState, [], []>
);
