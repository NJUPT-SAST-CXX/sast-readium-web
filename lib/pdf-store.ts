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
  type: 'highlight' | 'comment' | 'shape' | 'text';
  pageNumber: number;
  content?: string;
  color: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  timestamp: number;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  timestamp: number;
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

  // Outline/Bookmarks
  outline: PDFOutlineNode[];

  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  caseSensitiveSearch: boolean;

  // Annotations
  annotations: Annotation[];
  
  // Bookmarks
  bookmarks: Bookmark[];

  // Recent files
  recentFiles: RecentFile[];
  
  // Reading progress
  readingProgress: number; // 0-100 percentage

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
  setOutline: (outline: PDFOutlineNode[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  toggleCaseSensitiveSearch: () => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  addBookmark: (pageNumber: number, title: string) => void;
  removeBookmark: (id: string) => void;
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;
  updateReadingProgress: (progress: number) => void;
  resetPDF: () => void;
}

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
      outline: [],
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: 0,
      caseSensitiveSearch: false,
      annotations: [],
      bookmarks: [],
      recentFiles: [],
      readingProgress: 0,

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
        set((state) => ({ annotations: [...state.annotations, newAnnotation] }));
      },

      removeAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        }));
      },

      updateAnnotation: (id, updates) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
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
      }),
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        isDarkMode: state.isDarkMode,
        annotations: state.annotations,
        bookmarks: state.bookmarks,
      }),
    }
  )
);

