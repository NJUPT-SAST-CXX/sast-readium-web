# Sidebar Layout Implementation Analysis

## Part 1: Evidence

### PDF Viewer Main Layout Structure

<CodeSection>

## Code Section: Main PDF Viewer Layout Container

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 1498-1632

**Purpose:** Defines the main layout container with multiple sidebar panels positioned on the left side of the PDF viewer.

```tsx
<div className={cn("flex flex-1 overflow-hidden", contentBottomPadding)}>
  {/* Thumbnail Sidebar - Left Position */}
  <div
    className={cn(
      "relative flex flex-col bg-muted/30 overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
      showThumbnails
        ? "border-r border-border opacity-100 translate-x-0"
        : "opacity-0 -translate-x-2 pointer-events-none",
      "sm:relative absolute h-full shadow-xl sm:shadow-none"
    )}
    style={{ width: showThumbnails ? `${sidebarWidth}px` : 0 }}
  >
    {/* Content */}
  </div>

  {/* Outline/TOC Sidebar - Left Position */}
  <div
    className={cn(
      "relative bg-muted/30 flex flex-col overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
      showOutline
        ? "border-r border-border opacity-100 translate-x-0"
        : "opacity-0 -translate-x-2 pointer-events-none",
      "sm:relative absolute h-full shadow-xl sm:shadow-none"
    )}
    style={{ width: showOutline ? `${sidebarWidth}px` : 0 }}
  >
    {/* Content */}
  </div>

  {/* Main PDF Content Area */}
  <div
    className="flex-1 overflow-auto bg-muted/50"
    style={{ scrollBehavior: enableSmoothScrolling ? "smooth" : "auto" }}
  >
    {/* PDF pages rendered here */}
  </div>
</div>
```

**Key Details:**

- Uses flexbox with `flex-1 overflow-hidden` for proper space distribution
- Multiple sidebars stacked horizontally on the left
- Conditional visibility using Tailwind classes (opacity, translate transforms)
- Dynamic width styling: `width: showThumbnails ? '${sidebarWidth}px' : 0`
- Z-index management: sidebars at `z-20`
- Smooth transitions: `duration-250 ease-out` with `will-change-transform` for performance
- Mobile overlay: absolute positioning on mobile (`sm:relative` breakpoint), relative on desktop
- Border styling: `border-r border-border` only when visible
- Background color: `bg-muted/30` for sidebar panels

</CodeSection>

### Sidebar Resize Handler Implementation

<CodeSection>

## Code Section: Sidebar Resize Logic

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 1089-1127

**Purpose:** Handles dynamic sidebar width resizing with mouse interactions and localStorage persistence.

```tsx
const handleResizeStart = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsResizing(true);

  const startX = e.clientX;
  const startWidth = sidebarWidth;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(Math.max(startWidth + deltaX, 180), 500); // Min: 180px, Max: 500px
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    localStorage.setItem("pdf-sidebar-width", sidebarWidth.toString());
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// Resize handle divider attached to sidebar
<div
  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
  onMouseDown={handleResizeStart}
>
  <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
</div>
```

**Key Details:**

- Constraint range: 180px minimum to 500px maximum
- State during resize: `setIsResizing(true)` to prevent other interactions
- Persistence: localStorage key `pdf-sidebar-width`
- UX enhancements: cursor changes to `col-resize`, user-select disabled during drag
- Resize handle: positioned absolutely at `right-0`, width 1px (thin line)
- Hover state: `hover:bg-primary/50` with smooth `transition-colors`
- Nested div structure allows smooth hover effect independent of content

</CodeSection>

### Sidebar State Management

<CodeSection>

## Code Section: Sidebar State in PDF Store

**File:** `lib/pdf-store.ts`
**Lines:** 78-80, 160-162, 360-362, 631-637

**Purpose:** Zustand store managing sidebar visibility toggles and width initialization.

```tsx
// Interface definitions
interface DocumentStateSnapshot {
  showThumbnails: boolean;
  showOutline: boolean;
  showAnnotations: boolean;
  sidebarInitialWidth: number;
}

// State selectors (lines 360-362)
showThumbnails: state.showThumbnails,
showOutline: state.showOutline,
showAnnotations: state.showAnnotations,
sidebarInitialWidth: state.sidebarInitialWidth,

// Toggle actions (lines 631-637)
toggleThumbnails: () =>
  set((state) => ({ showThumbnails: !state.showThumbnails })),
toggleOutline: () =>
  set((state) => ({ showOutline: !state.showOutline })),
toggleAnnotations: () =>
  set((state) => ({ showAnnotations: !state.showAnnotations })),
```

**Key Details:**

- Three independent boolean toggles for sidebar visibility
- Default initial width: 240px (`sidebarInitialWidth: 240`)
- Runtime width stored in React state (`useState`), separate from Zustand
- Persistent state uses Zustand's persist middleware
- Toggle functions return new state for Zustand's immutable updates

</CodeSection>

### Sidebar Width Initialization and Persistence

<CodeSection>

## Code Section: Runtime Width State with LocalStorage

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 162-171

**Purpose:** Initializes sidebar width from localStorage or responsive defaults.

```tsx
const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("pdf-sidebar-width");
    if (saved) return parseInt(saved, 10);
    // Responsive default: smaller on mobile
    return window.innerWidth < 640 ? 200 : sidebarInitialWidth;
  }
  return sidebarInitialWidth;
});
```

**Key Details:**

- SSR safe: checks `typeof window !== "undefined"`
- Three-tier width priority: saved width > responsive default > store initial width
- Mobile responsive: 200px on small screens (`window.innerWidth < 640`), else store default
- Separate state from Zustand: width is ephemeral per session, not persisted to store
- Stored in localStorage under key: `pdf-sidebar-width`

</CodeSection>

### Multiple Sidebar Integration Pattern

<CodeSection>

## Code Section: Layered Sidebars - Thumbnails, Outline, Bookmarks, Annotations

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 1499-1632

**Purpose:** Four independent sidebar panels stack horizontally, each with own visibility toggle and resize handle.

```tsx
{/* Thumbnails Panel */}
<div style={{ width: showThumbnails ? `${sidebarWidth}px` : 0 }}>
  <ScrollArea className="flex-1 h-full">
    <DndContext /* drag-drop for reordering pages */ />
  </ScrollArea>
  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50" onMouseDown={handleResizeStart} />
</div>

{/* Outline/TOC Panel */}
<div style={{ width: showOutline ? `${sidebarWidth}px` : 0 }}>
  <PDFOutline outline={outline} onNavigate={handleBookmarkNavigate} />
  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50" onMouseDown={handleResizeStart} />
</div>

{/* Bookmarks Panel */}
<div style={{ width: showBookmarksPanel ? `${sidebarWidth}px` : 0 }}>
  <PDFBookmarks onNavigate={handleBookmarkNavigate} />
  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50" onMouseDown={handleResizeStart} />
</div>

{/* Annotations Panel */}
<div style={{ width: showAnnotations ? `${sidebarWidth}px` : 0 }}>
  <PDFAnnotationsList onNavigate={handleAnnotationNavigate} />
  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50" onMouseDown={handleResizeStart} />
</div>
```

**Key Details:**

- Each panel independent visibility toggle: `showThumbnails`, `showOutline`, `showBookmarksPanel`, `showAnnotations`
- Shared width value: all panels use same `sidebarWidth` state
- Each panel has own resize handle attached to right edge
- All share same styling pattern: opacity transitions, translate transforms, absolute positioning on mobile
- Thumbnails include drag-and-drop context for page reordering

</CodeSection>

### AI Sidebar Implementation

<CodeSection>

## Code Section: AI Sidebar Component Structure

**File:** `components/ai-sidebar/ai-sidebar.tsx`
**Lines:** 14-89

**Purpose:** Right-side fixed sidebar for AI features with tabbed interface.

```tsx
export function AISidebar() {
  const { isSidebarOpen, setSidebarOpen } = useAIChatStore();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-full md:w-[400px] lg:w-[480px]",
        "bg-background border-l border-border",
        "shadow-2xl z-50",
        "flex flex-col",
        "transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header with title and close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        {/* Sparkles icon + Title */}
        {/* Close button */}
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
          {/* 4 tab triggers: Chat, Tools, History, Settings */}
        </TabsList>

        {/* Tab Content Areas */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="chat" className="h-full m-0 p-0">
            <AIChatPanel />
          </TabsContent>
          {/* Other tab contents */}
        </div>
      </Tabs>
    </div>
  );
}
```

**Key Details:**

- Fixed positioning: `fixed right-0 top-0 h-full`
- Responsive widths: `w-full md:w-[400px] lg:w-[480px]`
- Z-index priority: `z-50` (above PDF viewer sidebars)
- Hide/show animation: `translate-x-full` when closed, `translate-x-0` when open
- Transition: `duration-300 ease-in-out`
- Tab-based content: 4 tabs with grid layout `grid-cols-4`
- Full-height flex structure: accommodates large content areas

</CodeSection>

### AI Chat Panel Layout

<CodeSection>

## Code Section: AI Chat Panel Full-Height Structure

**File:** `components/ai-sidebar/ai-chat-panel.tsx`
**Lines:** 70-203

**Purpose:** Tabbed content area with conversation scroll area, input zone, and action bar.

```tsx
<div className="h-full flex flex-col">
  {/* Error Alert - conditional */}
  {error && (
    <Alert variant="destructive" className="m-4 mb-0">
      {/* Error content */}
    </Alert>
  )}

  {/* API Key Warning - conditional */}
  {!hasAPIKey && (
    <Alert className="m-4 mb-0">
      {/* Warning content */}
    </Alert>
  )}

  {/* Conversation History - flex-1 (scrollable) */}
  <div ref={conversationRef} className="flex-1 overflow-hidden">
    <Conversation>
      <div
        data-conversation-content
        className="h-full overflow-y-auto p-4 space-y-4"
      >
        {/* Message items or empty state */}
      </div>
    </Conversation>
  </div>

  {/* Action Bar - conditional (space-efficient) */}
  {messages.length > 0 && (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/30">
      {/* New Conversation and Clear buttons */}
    </div>
  )}

  {/* Input Section - fixed height */}
  <div className="p-4 border-t border-border bg-background">
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea /* rows={3} */ />
      <PromptInputSubmit />
    </PromptInput>
  </div>
</div>
```

**Key Details:**

- Three-zone layout: alerts, conversation, actions, input
- `flex-1 overflow-hidden` on conversation: takes remaining space with scrollable content
- Input section: fixed height at bottom with `border-t` separator
- Action bar appears only when messages exist (space-efficient)
- Alert stacking at top: error above API key warning
- Inner scroll: conversation content has `overflow-y-auto`

</CodeSection>

### PDF Outline Sidebar Component

<CodeSection>

## Code Section: PDF Outline Sidebar Structure

**File:** `components/pdf-viewer/pdf-outline.tsx`
**Lines:** 144-194

**Purpose:** Table of contents sidebar with search filtering capability.

```tsx
<div className="flex h-full flex-col">
  {/* Search Input Header */}
  <div className="border-b border-border p-2">
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search bookmarks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-8 pl-8 pr-8 text-sm"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>

  {/* Bookmarks List - scrollable */}
  <ScrollArea className="flex-1">
    <div className="p-2">
      <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
        Bookmarks {searchQuery && `(${filteredOutline.length} results)`}
      </div>
      {filteredOutline.length > 0 ? (
        filteredOutline.map((item, index) => (
          <OutlineItem key={index} item={item} level={0} {...props} />
        ))
      ) : (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
          No bookmarks match your search
        </div>
      )}
    </div>
  </ScrollArea>
</div>
```

**Key Details:**

- Header search: fixed height with `border-b`
- Content area: `ScrollArea` with `flex-1` for flexible scrolling
- Icon positioning: search icon absolute left, clear icon absolute right
- Result counter: shows filtered count only when searching
- Empty state: centered text when no results
- Recursive outline items: hierarchical tree rendering with indentation

</CodeSection>

### PDF Bookmarks Sidebar Component

<CodeSection>

## Code Section: PDF Bookmarks Sidebar with Add Controls

**File:** `components/pdf-viewer/pdf-bookmarks.tsx`
**Lines:** 33-123

**Purpose:** User-created bookmarks management sidebar.

```tsx
<div className="flex h-full flex-col">
  {/* Header with Add Button */}
  <div className="border-b border-border p-3">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">My Bookmarks</h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsAdding(!isAdding)}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>

    {/* Inline Add Form - conditional */}
    {isAdding && (
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Bookmark name..."
          value={bookmarkTitle}
          onChange={(e) => setBookmarkTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddBookmark();
            else if (e.key === "Escape") setIsAdding(false);
          }}
          className="h-8 text-sm"
          autoFocus
        />
        <Button size="sm" onClick={handleAddBookmark} className="h-8">
          Add
        </Button>
      </div>
    )}
  </div>

  {/* Bookmarks List - scrollable */}
  <ScrollArea className="flex-1">
    <div className="p-2">
      {sortedBookmarks.length === 0 ? (
        /* Empty state */
      ) : (
        <div className="space-y-1">
          {sortedBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className={cn(
                "group flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent",
                bookmark.pageNumber === currentPage && "bg-accent/50"
              )}
            >
              <button onClick={() => onNavigate(bookmark.pageNumber)}>
                <Star className="h-4 w-4 flex-shrink-0 fill-primary text-primary" />
                {/* Bookmark info */}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeBookmark(bookmark.id)}
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  </ScrollArea>
</div>
```

**Key Details:**

- Header fixed: contains add button and inline form
- Conditional form: add input appears inline when `isAdding` state active
- Hover actions: delete button hidden by default, visible on hover (`opacity-0` → `opacity-100`)
- Group styling: `group` and `group-hover` for coordinated hover effects
- Navigation: clicking star icon navigates to page
- Selection indicator: `bg-accent/50` when on current page
- Sort order: bookmarks sorted by page number ascending

</CodeSection>

### Main Application Layout Integration

<CodeSection>

## Code Section: App-Level Sidebar Integration

**File:** `app/page.tsx`
**Lines:** 204-225

**Purpose:** Root component integrating PDF viewer with right-side AI sidebar.

```tsx
return (
  <div className="relative h-screen w-full bg-background">
    {/* Drag and Drop Overlay - conditional z-50 */}
    {isDragging && openDocuments.length === 0 && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {/* Drag UI */}
      </div>
    )}

    {/* Main Flex Container */}
    <div className="flex h-full w-full overflow-hidden">
      {/* Left: PDF Viewer (flex-1 with internal sidebars) */}
      <div className="flex-1 min-w-0">
        {mainContent}
      </div>

      {/* Right: AI Sidebar (fixed positioning internally) */}
      <AISidebar />
    </div>
  </div>
);
```

**Key Details:**

- Root container: `h-screen w-full` full viewport coverage
- Main flex: `flex h-full w-full overflow-hidden` prevents overflow
- Left section: `flex-1 min-w-0` allows shrinking for AI sidebar
- Right section: `AISidebar` component self-manages positioning with `fixed right-0`
- Drag overlay: `fixed inset-0 z-50` on top of everything
- Semantic separation: PDF viewer and AI sidebar as distinct containers

</CodeSection>

---

## Part 2: Findings

### Overall Architecture Pattern

The application uses a **composite sidebar layout** system with four primary patterns:

1. **Left-Side Stackable Sidebars (PDF Viewer)**: The PDF viewer contains four independent, horizontally-stacked sidebars that can be toggled independently:
   - Thumbnails (drag-and-drop enabled)
   - Outline/TOC
   - Bookmarks
   - Annotations

2. **Right-Side Fixed Overlay (AI Sidebar)**: A fixed-position sidebar that overlays on the right edge, independent from the main layout system.

3. **Responsive Behavior**:
   - Desktop: sidebars relative positioning with smooth integration
   - Mobile: absolute positioning to overlay content with shadows
   - Breakpoint: Tailwind's `sm` breakpoint (640px) controls switch

4. **Dynamic Sizing**: Sidebars share a single width value that persists to localStorage and respects minimum (180px) and maximum (500px) constraints.

### Sidebar Visibility Management

Sidebar visibility uses three independent boolean toggles stored in Zustand:
- `showThumbnails`
- `showOutline`
- `showAnnotations`

Additionally, `showBookmarksPanel` is managed separately in React state. These enable selective showing/hiding of any combination of sidebar panels.

### Styling Approach

The application uses **Tailwind CSS utility-first styling** with conditional class application via `cn()` utility:

**Base structure classes:**
- Layout: `flex flex-col`, `flex-1 overflow-hidden`
- Positioning: `relative`, `absolute right-0`
- Transitions: `transition-[width,opacity,transform] duration-250 ease-out`
- Performance: `will-change-transform` for GPU acceleration

**Visibility classes:**
- Visible: `opacity-100 translate-x-0 border-r border-border`
- Hidden: `opacity-0 -translate-x-2 pointer-events-none`

**Responsive classes:**
- Mobile: `absolute h-full shadow-xl` (overlay)
- Desktop (sm+): `relative shadow-none`

**Color/depth:**
- Background: `bg-muted/30`
- Border: `border-r border-border`
- Shadow: `shadow-2xl` for AI sidebar, `shadow-xl` for mobile overlay
- Z-index: `z-20` for PDF sidebars, `z-50` for AI sidebar

### Resize Handle Pattern

Each sidebar includes a resize handle (thin vertical line at right edge) with:
- **Positioning**: `absolute right-0 top-0 bottom-0 w-1` (1px wide divider)
- **Interactivity**: `cursor-col-resize` on hover, `hover:bg-primary/50`
- **Behavior**: Drag to resize between 180px-500px, constrained via calculations
- **Persistence**: Width saved to localStorage after resize completes
- **UX**: Disables text selection and changes cursor during drag

### Scroll Area Usage

Content areas within sidebars use shadcn's `ScrollArea` component with:
- `flex-1` to fill available space
- `overflow-auto` for scrolling
- `h-full` for full height within flex container
- Padding/margin for content breathing room

### AI Sidebar Distinct Characteristics

The AI sidebar differs significantly from PDF sidebars:
- **Fixed positioning**: `fixed right-0 top-0 h-full` (not relative to PDF viewer)
- **Responsive widths**: `w-full md:w-[400px] lg:w-[480px]` (full width on mobile)
- **Higher z-index**: `z-50` vs `z-20` for PDF sidebars
- **Separate state management**: Uses `AIChatStore` (ai-chat-store.ts), not PDF store
- **Tabbed interface**: 4 tabs for Chat, Tools, History, Settings
- **Transform animation**: `translate-x-full` when closed

### Content-Specific Sidebar Layouts

**Thumbnails Sidebar:**
- Contains drag-and-drop context (`DndContext` from @dnd-kit)
- Grid layout for page thumbnails with spacing
- Sortable context for drag-to-reorder

**Outline Sidebar:**
- Search input at top with clear button
- Recursive tree rendering with indentation (`paddingLeft: level * 16 + 8`)
- Expandable/collapsible nodes
- Current page highlighting

**Bookmarks Sidebar:**
- Quick add form (inline, conditional)
- Star icon to indicate bookmarks
- Hover-based delete button
- Sorted by page number

**Annotations Sidebar:**
- Type-specific icons (highlight, comment, shape, text)
- Color indicators
- Page reference for each annotation
- Navigation on click

**AI Chat Sidebar:**
- Error and API key alerts at top
- Scrollable conversation history
- Conditional action bar (new/clear conversation)
- Fixed input area at bottom with textarea

### Performance Optimizations

1. **GPU Acceleration**: `will-change-transform` on sidebar containers
2. **Smooth Scrolling**: Optional setting stored in state
3. **Debounced Resize**: 150ms throttle on window resize
4. **Lazy Loading**: Thumbnail pages load in chunks (5 at a time, 50ms delay)
5. **Conditional Rendering**: Visibility handled via CSS opacity/transform rather than DOM removal

### Mobile Behavior

On mobile devices (below `sm` breakpoint):
- Sidebars use `absolute h-full` positioning to overlay content
- Add `shadow-xl` for depth perception
- Full width available (`w-full` or calculated max)
- Can be swiped/toggled to show/hide content
- Main content not squeezed horizontally

On desktop:
- Sidebars use `relative` positioning
- Integrate into normal document flow
- Take up horizontal space, shrinking available viewport
- No shadows (visual separation via border)

### State Persistence Strategy

**Persisted to localStorage:**
- Sidebar width: `pdf-sidebar-width` (number)
- Zustand store persists: zoom, theme, all visibility toggles, bookmarks, annotations

**Session-only (ephemeral):**
- Current page position
- Recent file URLs
- AI chat message history (persisted in localStorage via Zustand persist)

### Width Calculation Logic

The sidebar width initialization follows a three-tier fallback:

1. **Check localStorage**: If `pdf-sidebar-width` exists, parse and use
2. **Responsive default**: If mobile (width < 640px), use 200px
3. **Store initial**: Otherwise use `sidebarInitialWidth` from store (default 240px)

During runtime, width is updated via React state and persisted only after resize completes.

