# PDF Store API

The PDF Store (`lib/pdf-store.ts`) is a Zustand store that manages all PDF-related state in the application.

## Import

```typescript
import { usePDFStore } from "@/lib/pdf-store";
```

## State

### Document State

| Property      | Type                  | Description                     |
| ------------- | --------------------- | ------------------------------- |
| `pdfUrl`      | `string \| null`      | URL of the current PDF          |
| `numPages`    | `number`              | Total number of pages           |
| `currentPage` | `number`              | Current page number (1-indexed) |
| `metadata`    | `PDFMetadata \| null` | PDF metadata                    |
| `outline`     | `PDFOutlineNode[]`    | Document outline/TOC            |
| `isLoading`   | `boolean`             | Loading state                   |

### View State

| Property    | Type        | Default      | Description                     |
| ----------- | ----------- | ------------ | ------------------------------- |
| `zoom`      | `number`    | `1`          | Zoom level (0.5-5)              |
| `rotation`  | `number`    | `0`          | Page rotation (0, 90, 180, 270) |
| `viewMode`  | `ViewMode`  | `"single"`   | View mode                       |
| `fitMode`   | `FitMode`   | `"fitWidth"` | Fit mode                        |
| `themeMode` | `ThemeMode` | `"auto"`     | Theme mode                      |

### UI State

| Property          | Type      | Default | Description            |
| ----------------- | --------- | ------- | ---------------------- |
| `isFullscreen`    | `boolean` | `false` | Fullscreen state       |
| `showThumbnails`  | `boolean` | `true`  | Show thumbnail sidebar |
| `showOutline`     | `boolean` | `false` | Show outline sidebar   |
| `showAnnotations` | `boolean` | `true`  | Show annotations       |
| `isSelectionMode` | `boolean` | `false` | Text selection mode    |

### Annotations

| Property                  | Type                | Description              |
| ------------------------- | ------------------- | ------------------------ |
| `annotations`             | `Annotation[]`      | All annotations          |
| `annotationHistory`       | `AnnotationHistory` | Undo/redo history        |
| `selectedAnnotationColor` | `string`            | Current annotation color |
| `selectedStrokeWidth`     | `number`            | Current stroke width     |

### Bookmarks

| Property    | Type         | Description    |
| ----------- | ------------ | -------------- |
| `bookmarks` | `Bookmark[]` | User bookmarks |

### Search

| Property              | Type             | Description          |
| --------------------- | ---------------- | -------------------- |
| `searchQuery`         | `string`         | Current search query |
| `searchResults`       | `SearchResult[]` | Search results       |
| `currentSearchIndex`  | `number`         | Current result index |
| `caseSensitiveSearch` | `boolean`        | Case sensitivity     |

### TTS

| Property       | Type      | Default | Description   |
| -------------- | --------- | ------- | ------------- |
| `isReading`    | `boolean` | `false` | TTS active    |
| `speechRate`   | `number`  | `1`     | Speech rate   |
| `speechVolume` | `number`  | `1`     | Speech volume |

### Watermark

| Property           | Type     | Default     | Description         |
| ------------------ | -------- | ----------- | ------------------- |
| `watermarkText`    | `string` | `""`        | Watermark text      |
| `watermarkColor`   | `string` | `"#000000"` | Watermark color     |
| `watermarkOpacity` | `number` | `0.1`       | Watermark opacity   |
| `watermarkSize`    | `number` | `48`        | Watermark font size |

## Types

### ViewMode

```typescript
type ViewMode = "single" | "continuous" | "twoPage";
```

### FitMode

```typescript
type FitMode = "custom" | "fitWidth" | "fitPage";
```

### ThemeMode

```typescript
type ThemeMode = "light" | "dark" | "sepia" | "auto";
```

### Annotation

```typescript
interface Annotation {
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
  path?: Array<{ x: number; y: number }>;
  strokeWidth?: number;
  timestamp: number;
}
```

### Bookmark

```typescript
interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  timestamp: number;
}
```

### PDFMetadata

```typescript
interface PDFMetadata {
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  contentLength?: number;
}
```

## Actions

### Navigation

```typescript
// Set current page
setCurrentPage: (page: number) => void

// Navigate to next page
nextPage: () => void

// Navigate to previous page
previousPage: () => void

// Go to specific page
goToPage: (page: number) => void
```

### Zoom

```typescript
// Set zoom level
setZoom: (zoom: number) => void

// Zoom in by step
zoomIn: () => void

// Zoom out by step
zoomOut: () => void

// Reset zoom to 100%
resetZoom: () => void
```

### View

```typescript
// Set view mode
setViewMode: (mode: ViewMode) => void

// Set fit mode
setFitMode: (mode: FitMode) => void

// Set theme mode
setThemeMode: (mode: ThemeMode) => void

// Toggle fullscreen
toggleFullscreen: () => void

// Set rotation
setRotation: (rotation: number) => void
```

### Annotations

```typescript
// Add annotation
addAnnotation: (annotation: Annotation) => void

// Update annotation
updateAnnotation: (id: string, updates: Partial<Annotation>) => void

// Delete annotation
deleteAnnotation: (id: string) => void

// Undo last annotation action
undoAnnotation: () => void

// Redo undone action
redoAnnotation: () => void

// Clear all annotations
clearAnnotations: () => void
```

### Bookmarks

```typescript
// Add bookmark
addBookmark: (bookmark: Bookmark) => void

// Update bookmark
updateBookmark: (id: string, updates: Partial<Bookmark>) => void

// Delete bookmark
deleteBookmark: (id: string) => void
```

### Search

```typescript
// Set search query
setSearchQuery: (query: string) => void

// Set search results
setSearchResults: (results: SearchResult[]) => void

// Navigate to next result
nextSearchResult: () => void

// Navigate to previous result
previousSearchResult: () => void

// Clear search
clearSearch: () => void
```

## Usage Examples

### Basic Usage

```typescript
function PageNavigator() {
  const currentPage = usePDFStore((state) => state.currentPage);
  const numPages = usePDFStore((state) => state.numPages);
  const nextPage = usePDFStore((state) => state.nextPage);

  return (
    <div>
      <span>{currentPage} / {numPages}</span>
      <button onClick={nextPage}>Next</button>
    </div>
  );
}
```

### Selective Subscription

```typescript
// Only re-render when zoom changes
const zoom = usePDFStore((state) => state.zoom);

// Subscribe to multiple values with shallow comparison
import { shallow } from "zustand/shallow";

const { currentPage, numPages } = usePDFStore(
  (state) => ({
    currentPage: state.currentPage,
    numPages: state.numPages,
  }),
  shallow
);
```

### Actions Outside Components

```typescript
// Get action without subscribing
const addBookmark = usePDFStore.getState().addBookmark;

// Use in event handler
function handleAddBookmark() {
  addBookmark({
    id: nanoid(),
    pageNumber: usePDFStore.getState().currentPage,
    title: "My Bookmark",
    timestamp: Date.now(),
  });
}
```

### Persistence

The store automatically persists these fields to localStorage:

- `themeMode`
- `viewMode`
- `recentFiles`
- `bookmarks`
- Watermark settings
- Scroll settings
