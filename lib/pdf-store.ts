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

interface PDFState {
  // Current PDF state
  currentPDF: File | null;
  pdfUrl: string | null;
  numPages: number;
  currentPage: number;
  zoom: number;
  rotation: number;
  
  // UI state
  isFullscreen: boolean;
  showThumbnails: boolean;
  showOutline: boolean;
  isDarkMode: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  
  // Recent files
  recentFiles: RecentFile[];
  
  // Actions
  setCurrentPDF: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setNumPages: (numPages: number) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setRotation: (rotation: number) => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  toggleFullscreen: () => void;
  toggleThumbnails: () => void;
  toggleOutline: () => void;
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;
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
      isFullscreen: false,
      showThumbnails: false,
      showOutline: false,
      isDarkMode: false,
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: 0,
      recentFiles: [],

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
      
      setZoom: (zoom) => {
        if (zoom >= 0.25 && zoom <= 5) {
          set({ zoom });
        }
      },
      
      zoomIn: () => {
        const { zoom } = get();
        const newZoom = Math.min(zoom + 0.25, 5);
        set({ zoom: newZoom });
      },
      
      zoomOut: () => {
        const { zoom } = get();
        const newZoom = Math.max(zoom - 0.25, 0.25);
        set({ zoom: newZoom });
      },
      
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
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
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
        isFullscreen: false,
        showThumbnails: false,
        showOutline: false,
        searchQuery: '',
        searchResults: [],
        currentSearchIndex: 0,
      }),
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

