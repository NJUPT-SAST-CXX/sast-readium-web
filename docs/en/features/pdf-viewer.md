# PDF Viewer

The PDF viewer is the core component of SAST Readium, providing a rich reading experience with multiple view modes, navigation options, and customization settings.

## View Modes

### Single Page Mode

Displays one page at a time, ideal for focused reading.

- Navigate with arrow keys or page buttons
- Clean, distraction-free view
- Best for presentations or detailed reading

### Continuous Scroll Mode

All pages in a continuous scrollable view.

- Natural scrolling experience
- Quick navigation through long documents
- Visibility-based page tracking
- Optimized with virtual scrolling for performance

### Two-Page (Facing) Mode

Side-by-side page display, mimicking a physical book.

- Left and right pages displayed together
- Ideal for documents designed for print
- Maintains page spread relationships

## Navigation

### Page Navigation

| Method           | Description                                             |
| ---------------- | ------------------------------------------------------- |
| **Arrow Keys**   | ++arrow-left++ / ++arrow-right++ for previous/next page |
| **Page Buttons** | Click toolbar buttons                                   |
| **Page Input**   | Enter specific page number                              |
| **Thumbnails**   | Click thumbnail to jump to page                         |
| **Outline**      | Click table of contents entry                           |
| **Keyboard**     | ++home++ / ++end++ for first/last page                  |

### Go to Page Dialog

Press ++g++ or click the page indicator to open the Go to Page dialog:

1. Enter the desired page number
2. Press ++enter++ or click "Go"
3. The viewer jumps to that page

### Thumbnail Navigation

The thumbnail sidebar provides visual navigation:

- **Click** a thumbnail to navigate to that page
- **Drag and drop** to reorder pages (virtual reordering)
- **Scroll** through thumbnails for quick overview

### Document Outline

If the PDF has a table of contents:

1. Click the outline icon in the sidebar
2. Expand/collapse sections
3. Click any entry to navigate

## Zoom Controls

### Zoom Range

- **Minimum**: 50%
- **Maximum**: 500%
- **Default**: Fit to width

### Zoom Methods

| Method              | Action                            |
| ------------------- | --------------------------------- |
| **Toolbar Buttons** | Click +/- buttons                 |
| **Keyboard**        | ++plus++ / ++minus++ keys         |
| **Mouse Wheel**     | ++ctrl++ + scroll                 |
| **Pinch Gesture**   | Two-finger pinch on touch devices |
| **Preset**          | Select from dropdown              |

### Fit Modes

- **Fit Width**: Scale page to fill viewport width
- **Fit Page**: Scale entire page to fit in viewport
- **Custom**: Manual zoom percentage

## Page Rotation

Rotate pages for documents scanned at wrong angles:

- **90° clockwise**: Click rotate button or press ++r++
- **Rotation persists**: Per-page rotation is remembered
- **Supports**: 0°, 90°, 180°, 270°

## Search

### Full-Text Search

1. Press ++ctrl+f++ or click the search icon
2. Enter search term
3. Results are highlighted across all pages
4. Navigate between results with ++enter++ / ++shift+enter++

### Search Options

- **Case Sensitive**: Toggle for exact case matching
- **Result Count**: Shows total matches found
- **Current Position**: Indicates which result is focused

## Text Selection

### Selecting Text

1. Click and drag to select text
2. Selected text is highlighted
3. Context menu appears with options

### Selection Actions

- **Copy**: Copy text to clipboard
- **Highlight**: Add highlight annotation
- **Search**: Search for selected text
- **Speak**: Read selected text aloud (TTS)

## Sidebar

### Sidebar Panels

| Panel           | Content                 |
| --------------- | ----------------------- |
| **Thumbnails**  | Page previews           |
| **Outline**     | Table of contents       |
| **Bookmarks**   | User-created bookmarks  |
| **Annotations** | List of all annotations |

### Sidebar Controls

- **Toggle**: Click sidebar button or press ++ctrl+b++
- **Resize**: Drag the sidebar edge
- **Switch Panels**: Click panel tabs

## Settings

### Display Settings

- **Theme**: Light, Dark, Sepia, Auto
- **View Mode**: Single, Continuous, Two-Page
- **Show Annotations**: Toggle annotation visibility
- **Show Page Numbers**: Toggle page number overlay

### Scrolling Settings

- **Scroll Sensitivity**: Adjust scroll speed
- **Smooth Scrolling**: Enable/disable smooth scroll
- **Invert Wheel**: Reverse scroll direction

### Watermark Settings

- **Watermark Text**: Custom text overlay
- **Color**: Watermark color
- **Opacity**: Transparency level
- **Size**: Text size
- **Gap**: Spacing between watermarks
- **Rotation**: Watermark angle

## Keyboard Shortcuts

| Shortcut                         | Action             |
| -------------------------------- | ------------------ |
| ++arrow-left++ / ++arrow-right++ | Previous/Next page |
| ++home++ / ++end++               | First/Last page    |
| ++plus++ / ++minus++             | Zoom in/out        |
| ++0++                            | Reset zoom         |
| ++f++                            | Toggle fullscreen  |
| ++ctrl+f++                       | Open search        |
| ++ctrl+b++                       | Toggle sidebar     |
| ++r++                            | Rotate page        |
| ++g++                            | Go to page         |
| ++question++                     | Show all shortcuts |

## Touch Gestures

On touch devices:

| Gesture              | Action             |
| -------------------- | ------------------ |
| **Swipe Left/Right** | Next/Previous page |
| **Pinch**            | Zoom in/out        |
| **Double Tap**       | Toggle zoom        |
| **Long Press**       | Context menu       |

## Performance

### Optimizations

- **Virtual Scrolling**: Only renders visible pages
- **Lazy Loading**: Pages load on demand
- **Canvas Caching**: Rendered pages are cached
- **Web Workers**: Heavy operations run in background

### Large Documents

For documents with many pages:

- Thumbnails load progressively
- Search indexes in background
- Memory is managed automatically

## File Operations

### Desktop Only

In the Tauri desktop app:

- **Reveal in Finder/Explorer**: Show file location
- **Rename**: Rename the PDF file
- **Delete**: Move file to trash

### Properties

View PDF metadata:

- Title, Author, Subject
- Creation and modification dates
- PDF version
- File size
- Page count

### Metadata Editing

Edit PDF metadata (desktop):

1. Open Properties dialog
2. Click "Edit" button
3. Modify fields
4. Click "Save"

## Multi-Tab Support

Open multiple PDFs simultaneously:

- **New Tab**: ++ctrl+t++ or click + button
- **Switch Tabs**: Click tab or ++ctrl+tab++
- **Close Tab**: ++ctrl+w++ or click × button
- **Tab Context Menu**: Right-click for options

## Recent Files

Quick access to recently opened files:

1. Click "Recent Files" on welcome page
2. Or use File → Recent Files menu
3. Click any file to open
4. Clear history if needed
