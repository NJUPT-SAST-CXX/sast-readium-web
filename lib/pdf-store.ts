import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentFile {
  name: string;
  url: string;
  lastOpened: number;
  numPages?: number;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
}

export interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'shape' | 'text' | 'drawing';
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
  isPresentationMode: boolean;
  showKeyboardShortcuts: boolean;
  outline: PDFOutlineNode[];
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

export type ViewMode = 'single' | 'continuous' | 'twoPage';
export type FitMode = 'custom' | 'fitWidth' | 'fitPage';
export type AnnotationStamp = 'approved' | 'rejected' | 'confidential' | 'draft' | 'final' | 'reviewed';

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

  // Outline/Bookmarks
  outline: PDFOutlineNode[];

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
  
  // Reading progress
  readingProgress: number; // 0-100 percentage

  // Multi-document sessions
  activeDocumentId: string | null;
  documents: Record<string, DocumentStateSnapshot>;

  // Actions
  setCurrentPDF: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setNumPages: (numPages: number) => void;
  setCurrentPage: (page: number) => void;
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
  togglePresentationMode: () => void;
  toggleKeyboardShortcuts: () => void;
  setOutline: (outline: PDFOutlineNode[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  toggleCaseSensitiveSearch: () => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  undoAnnotation: () => void;
  redoAnnotation: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setSelectedAnnotationColor: (color: string) => void;
  setSelectedStrokeWidth: (width: number) => void;
  addStampAnnotation: (stamp: AnnotationStamp, pageNumber: number, position: { x: number; y: number }) => void;
  exportAnnotations: () => string;
  importAnnotations: (data: string) => void;
  addBookmark: (pageNumber: number, title: string) => void;
  removeBookmark: (id: string) => void;
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;
  updateReadingProgress: (progress: number) => void;
  resetPDF: () => void;
  openDocumentSession: (id: string) => void;
  closeDocumentSession: (id: string) => void;
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
  isPresentationMode: state.isPresentationMode,
  showKeyboardShortcuts: state.showKeyboardShortcuts,
  outline: state.outline,
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
      viewMode: 'single' as ViewMode,
      fitMode: 'custom' as FitMode,
      isFullscreen: false,
      showThumbnails: false,
      showOutline: false,
      showAnnotations: false,
      isDarkMode: false,
      isPresentationMode: false,
      showKeyboardShortcuts: false,
      outline: [],
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: 0,
      caseSensitiveSearch: false,
      annotations: [],
      annotationHistory: {
        past: [],
        present: [],
        future: [],
      },
      selectedAnnotationColor: '#ffff00',
      selectedStrokeWidth: 2,
      bookmarks: [],
      recentFiles: [],
      readingProgress: 0,
      activeDocumentId: null,
      documents: {},

      // Actions
      setCurrentPDF: (file) => set({ currentPDF: file }),

      setPdfUrl: (url) => set({ pdfUrl: url }),

      setNumPages: (numPages) => set({ numPages }),

      setCurrentPage: (page) => {
        const { numPages } = get();
        if (page >= 1 && page <= numPages) {
          set({ currentPage: page });
        }
      },

      nextPage: () => {
        const { currentPage, numPages } = get();
        if (currentPage < numPages) {
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
        const { numPages } = get();
        if (page >= 1 && page <= numPages) {
          set({ currentPage: page });
        }
      },

      firstPage: () => {
        set({ currentPage: 1 });
      },

      lastPage: () => {
        const { numPages } = get();
        set({ currentPage: numPages });
      },

      setZoom: (zoom) => {
        // Zoom limits: 50% to 300%
        if (zoom >= 0.5 && zoom <= 3.0) {
          set({ zoom, fitMode: 'custom' });
        }
      },

      zoomIn: () => {
        const { zoom } = get();
        // Increment by 0.25 (25%) with max of 300%
        const newZoom = Math.min(zoom + 0.25, 3.0);
        set({ zoom: newZoom, fitMode: 'custom' });
      },

      zoomOut: () => {
        const { zoom } = get();
        // Decrement by 0.25 (25%) with min of 50%
        const newZoom = Math.max(zoom - 0.25, 0.5);
        set({ zoom: newZoom, fitMode: 'custom' });
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

      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      toggleThumbnails: () => set((state) => ({ showThumbnails: !state.showThumbnails })),

      toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),

      toggleAnnotations: () => set((state) => ({ showAnnotations: !state.showAnnotations })),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      togglePresentationMode: () => set((state) => ({ isPresentationMode: !state.isPresentationMode })),

      toggleKeyboardShortcuts: () => set((state) => ({ showKeyboardShortcuts: !state.showKeyboardShortcuts })),

      setOutline: (outline) => set({ outline }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSearchResults: (results) => set({ searchResults: results, currentSearchIndex: 0 }),

      nextSearchResult: () => {
        const { currentSearchIndex, searchResults } = get();
        if (searchResults.length > 0) {
          const newIndex = (currentSearchIndex + 1) % searchResults.length;
          set({ currentSearchIndex: newIndex, currentPage: searchResults[newIndex].pageNumber });
        }
      },

      previousSearchResult: () => {
        const { currentSearchIndex, searchResults } = get();
        if (searchResults.length > 0) {
          const newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
          set({ currentSearchIndex: newIndex, currentPage: searchResults[newIndex].pageNumber });
        }
      },

      toggleCaseSensitiveSearch: () => set((state) => ({ caseSensitiveSearch: !state.caseSensitiveSearch })),

      addAnnotation: (annotation) => {
        const newAnnotation: Annotation = {
          ...annotation,
          id: `annotation-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
          annotationHistory: {
            past: [...state.annotationHistory.past, state.annotationHistory.present],
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
              past: [...state.annotationHistory.past, state.annotationHistory.present],
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
              past: [...state.annotationHistory.past, state.annotationHistory.present],
              present: newAnnotations,
              future: [], // Clear redo stack
            },
          };
        });
      },

      undoAnnotation: () => {
        set((state) => {
          if (state.annotationHistory.past.length === 0) return state;

          const previous = state.annotationHistory.past[state.annotationHistory.past.length - 1];
          const newPast = state.annotationHistory.past.slice(0, -1);

          return {
            annotations: previous,
            annotationHistory: {
              past: newPast,
              present: previous,
              future: [state.annotationHistory.present, ...state.annotationHistory.future],
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
              past: [...state.annotationHistory.past, state.annotationHistory.present],
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

      setSelectedAnnotationColor: (color) => set({ selectedAnnotationColor: color }),

      setSelectedStrokeWidth: (width) => set({ selectedStrokeWidth: width }),

      addStampAnnotation: (stamp, pageNumber, position) => {
        const stampTexts: Record<AnnotationStamp, string> = {
          approved: '✓ APPROVED',
          rejected: '✗ REJECTED',
          confidential: '🔒 CONFIDENTIAL',
          draft: '📝 DRAFT',
          final: '✓ FINAL',
          reviewed: '👁 REVIEWED',
        };

        const stampColors: Record<AnnotationStamp, string> = {
          approved: '#22c55e',
          rejected: '#ef4444',
          confidential: '#f59e0b',
          draft: '#6366f1',
          final: '#10b981',
          reviewed: '#3b82f6',
        };

        const newAnnotation: Annotation = {
          id: `stamp-${Date.now()}-${Math.random()}`,
          type: 'text',
          pageNumber,
          content: stampTexts[stamp],
          color: stampColors[stamp],
          position,
          timestamp: Date.now(),
        };

        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
          annotationHistory: {
            past: [...state.annotationHistory.past, state.annotationHistory.present],
            present: [...state.annotations, newAnnotation],
            future: [],
          },
        }));
      },

      exportAnnotations: () => {
        const state = get();
        const exportData = {
          annotations: state.annotations,
          bookmarks: state.bookmarks,
          exportDate: new Date().toISOString(),
          version: '1.0',
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
                past: [...state.annotationHistory.past, state.annotationHistory.present],
                present: [...state.annotations, ...importData.annotations],
                future: [],
              },
            }));
          }
        } catch (error) {
          console.error('Failed to import annotations:', error);
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
        const updated = [file, ...filtered].slice(0, 10); // Keep only 10 most recent
        set({ recentFiles: updated });
      },

      clearRecentFiles: () => set({ recentFiles: [] }),

      resetPDF: () => set({
        currentPDF: null,
        pdfUrl: null,
        numPages: 0,
        currentPage: 1,
        zoom: 1.0,
        rotation: 0,
        viewMode: 'single',
        fitMode: 'custom',
        isFullscreen: false,
        showThumbnails: false,
        showOutline: false,
        showAnnotations: false,
        outline: [],
        searchQuery: '',
        searchResults: [],
        currentSearchIndex: 0,
        caseSensitiveSearch: false,
        annotations: [],
        bookmarks: [],
        readingProgress: 0,
        activeDocumentId: null,
        documents: {},
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

          const snapshot: DocumentStateSnapshot =
            existing || {
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
              isPresentationMode: state.isPresentationMode,
              showKeyboardShortcuts: state.showKeyboardShortcuts,
              outline: [],
              searchQuery: '',
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
            isDarkMode: snapshot.isDarkMode,
            isPresentationMode: snapshot.isPresentationMode,
            showKeyboardShortcuts: snapshot.showKeyboardShortcuts,
            outline: snapshot.outline,
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
            showAnnotations: nextSnapshot.showAnnotations,
            isDarkMode: nextSnapshot.isDarkMode,
            isPresentationMode: nextSnapshot.isPresentationMode,
            showKeyboardShortcuts: nextSnapshot.showKeyboardShortcuts,
            outline: nextSnapshot.outline,
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
          };
        });
      },
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        isDarkMode: state.isDarkMode,
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
        caseSensitiveSearch: state.caseSensitiveSearch,
        selectedAnnotationColor: state.selectedAnnotationColor,
        selectedStrokeWidth: state.selectedStrokeWidth,
      }),
    }
  )
);

