# Mobile Responsiveness and Mobile-Specific Implementation Analysis

## Evidence Section

### Mobile-Specific Components

<CodeSection>

## Code Section: PDF Mobile Toolbar Component

**File:** `components/pdf-viewer/pdf-mobile-toolbar.tsx`
**Lines:** 1-160
**Purpose:** Dedicated mobile toolbar shown only on screens under 640px width (sm breakpoint)

```tsx
interface PDFMobileToolbarProps {
  onSearch: () => void;
  onOpenSettings: () => void;
  orientation?: "portrait" | "landscape";
}

export function PDFMobileToolbar({
  onSearch,
  onOpenSettings,
  orientation = "portrait",
}: PDFMobileToolbarProps) {
  const isLandscape = orientation === "landscape";
  const sectionGap = isLandscape ? "gap-0.5" : "gap-1";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between border-t border-border bg-background sm:hidden z-50",
        "pt-safe pb-safe pr-safe pl-safe",
        isLandscape ? "h-12 px-2" : "h-14 px-4"
      )}
      data-orientation={orientation}
    >
```

**Key Details:**

- Uses `sm:hidden` to show only on mobile screens (< 640px)
- Implements orientation-aware layout with adaptive height (12px landscape, 14px portrait)
- Uses safe area insets (`pt-safe`, `pb-safe`, `pr-safe`, `pl-safe`) for notched devices
- Responsive gap sizing based on orientation
- Compact page counter display with adaptive width

</CodeSection>

<CodeSection>

## Code Section: Device Orientation Hook

**File:** `hooks/use-device-orientation.ts`
**Lines:** 1-73
**Purpose:** Detects device orientation and mobile viewport state with real-time updates

```tsx
const MOBILE_MEDIA_QUERY = "(max-width: 640px)";

const getInitialState = (): OrientationState => {
  if (typeof window === "undefined") {
    return {
      orientation: "portrait",
      isMobile: false,
      width: 0,
      height: 0,
    };
  }

  const { innerWidth, innerHeight } = window;
  const isLandscape = innerWidth > innerHeight;
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;

  return {
    orientation: isLandscape ? "landscape" : "portrait",
    isMobile,
    width: innerWidth,
    height: innerHeight,
  };
};

export function useDeviceOrientation() {
  const [state, setState] = useState<OrientationState>(() => getInitialState());

  useEffect(() => {
    const updateState = () => {
      setState(getInitialState());
    };

    window.addEventListener("resize", updateState);
    window.addEventListener("orientationchange", updateState);

    return () => {
      window.removeEventListener("resize", updateState);
      window.removeEventListener("orientationchange", updateState);
    };
  }, []);
```

**Key Details:**

- Mobile breakpoint hardcoded at 640px (Tailwind `sm` breakpoint)
- Tracks orientation changes via `orientationchange` event
- Provides orientation, isMobile, isMobileLandscape, isMobilePortrait flags
- Exposes viewport width and height
- SSR-safe with null check for window object

</CodeSection>

<CodeSection>

## Code Section: Touch Gesture Handler

**File:** `hooks/use-touch-gestures.ts`
**Lines:** 1-109
**Purpose:** Implements pinch-zoom and swipe navigation for touch devices

```tsx
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TouchGesturesOptions
) {
  const touchStartRef = useRef<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);
  const initialPinchDistance = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const minSwipeDistance = options.minSwipeDistance || 50;

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - for swipe
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          distance: 0,
        };
      } else if (e.touches.length === 2) {
        // Two fingers - for pinch zoom
        initialPinchDistance.current = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance.current > 0) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / initialPinchDistance.current;

        if (options.onPinchZoom) {
          options.onPinchZoom(scale);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && touchStartRef.current) {
        // Swipe gesture
        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStartRef.current.x;
        const deltaY = touchEnd.clientY - touchStartRef.current.y;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > minSwipeDistance || absY > minSwipeDistance) {
          if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0 && options.onSwipeRight) {
              options.onSwipeRight();
            } else if (deltaX < 0 && options.onSwipeLeft) {
              options.onSwipeLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0 && options.onSwipeDown) {
              options.onSwipeDown();
            } else if (deltaY < 0 && options.onSwipeUp) {
              options.onSwipeUp();
            }
          }
        }
      }
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, options]);
}
```

**Key Details:**

- Single touch swipe: min 50px distance threshold
- Two-finger pinch zoom: calculates distance ratio between fingers
- Non-passive touchmove listener for preventDefault() capability
- Distinguishes horizontal vs vertical swipes
- Swipe left/right used for page navigation
- Pinch zoom integrated with viewport zoom

</CodeSection>

<CodeSection>

## Code Section: PDF Viewer Layout with Mobile Sidebars

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 1450-1659
**Purpose:** Main viewer layout using responsive sidebar positioning

```tsx
const contentBottomPadding = isMobile
  ? isMobileLandscape
    ? "pb-12"
    : "pb-20"
  : "pb-16";

return (
  <div
    ref={viewerRef}
    className={cn(
      "flex h-screen flex-col bg-background",
      isDarkMode && "dark",
      themeMode === "sepia" && "sepia"
    )}
    data-orientation={orientation}
  >
    {/* ... toolbar ... */}

    <div className={cn("flex flex-1 overflow-hidden", contentBottomPadding)}>
      {/* Thumbnails Sidebar */}
      <div
        className={cn(
          "relative flex flex-col bg-muted/30 overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
          showThumbnails
            ? "border-r border-border opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none",
          // Mobile: Absolute positioning to overlay content
          "sm:relative absolute h-full shadow-xl sm:shadow-none"
        )}
        style={{ width: showThumbnails ? `${sidebarWidth}px` : 0 }}
      >
        {/* ... sidebar content ... */}
      </div>

      {/* Outline Sidebar */}
      <div
        className={cn(
          "relative bg-muted/30 flex flex-col overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
          showOutline
            ? "border-r border-border opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none",
          // Mobile: Absolute positioning to overlay content
          "sm:relative absolute h-full shadow-xl sm:shadow-none"
        )}
        style={{ width: showOutline ? `${sidebarWidth}px` : 0 }}
      >
        {/* ... sidebar content ... */}
      </div>
```

**Key Details:**

- Mobile sidebars use absolute positioning to overlay content
- Desktop sidebars use relative positioning
- Transitions controlled by `showThumbnails`, `showOutline`, `showBookmarksPanel`
- Adaptive bottom padding based on mobile/orientation (12px landscape, 20px portrait, 16px desktop)
- Smooth animations with translate and opacity
- Shadow effects only on mobile (`sm:shadow-none`)
- Sidebar width responsive defaults: 200px on mobile (< 640px), 280px on desktop

</CodeSection>

<CodeSection>

## Code Section: PDF Toolbar Responsive Breakpoints

**File:** `components/pdf-viewer/pdf-toolbar.tsx`
**Lines:** 205-300
**Purpose:** Main toolbar with extensive Tailwind breakpoint usage

```tsx
// Left Section
<div className="flex items-center gap-1 sm:gap-2">
  {/* Always visible */}
  <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
    <X className="h-5 w-5" />
  </Button>

  <Separator orientation="vertical" className="h-6 hidden sm:block" />

  {/* Toggle Menu - Always visible */}
  <Button variant="ghost" size="icon" onClick={toggleMenuBar}>
    <Menu className="h-5 w-5" />
  </Button>
</div>

// Center Section - Zoom Controls
<div className="flex items-center gap-1 sm:gap-2">
  <ButtonGroup className="hidden sm:flex overflow-visible">
    {/* Zoom controls hidden on mobile, shown sm+ */}
  </ButtonGroup>

  <Separator orientation="vertical" className="h-6 hidden sm:block" />

  <ButtonGroup className="hidden md:flex">
    {/* Rotation controls hidden on mobile/tablet, shown md+ */}
  </ButtonGroup>

  <Separator orientation="vertical" className="h-6 hidden md:block" />

  <ButtonGroup className="hidden lg:flex">
    {/* View mode controls hidden on smaller screens, shown lg+ */}
  </ButtonGroup>

  <ButtonGroup className="hidden xl:flex">
    {/* Fit mode controls hidden on smaller screens, shown xl+ */}
  </ButtonGroup>
</div>

// Right Section
<div className="flex items-center gap-1 sm:gap-2">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => onShowSearchChange?.(!showSearch)}
    className={cn(
      "shrink-0 hidden sm:flex",
      showSearch ? "bg-accent" : ""
    )}
  >
    <Search className="h-5 w-5" />
  </Button>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDarkMode}
        className="hidden md:flex"
      >
        {isDarkMode ? <Sun /> : <Moon />}
      </Button>
    </TooltipTrigger>
  </Tooltip>
</div>
```

**Key Details:**

- Mobile (< 640px): Only close, menu toggle, settings buttons visible
- Tablet (sm: 640px+): Adds search, download, separators
- Medium (md: 768px+): Adds rotation, dark mode, annotations controls
- Large (lg: 1024px+): Adds view mode controls (single/continuous/two-page)
- XL (xl: 1280px+): Adds fit mode controls
- Gap scaling: `gap-1` on mobile, `sm:gap-2` on larger screens
- All hidden/visible controls follow hierarchy of importance

</CodeSection>

<CodeSection>

## Code Section: Welcome Page Responsive Grid Layout

**File:** `components/welcome-page/welcome-page.tsx`
**Lines:** 500-532
**Purpose:** Landing page with responsive column layout

```tsx
<header className="border-b border-border px-6 py-4">
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      {/* Logo and title - always visible */}
    </div>
    <div className="flex items-center gap-4">
      {/* Tagline hidden on mobile */}
      <span className="hidden text-xs text-muted-foreground sm:inline-flex">
        {t("app.tagline")}
      </span>
      <LanguageSwitcher />
    </div>
  </div>
</header>

<main className="flex-1 overflow-auto">
  <div className="mx-auto max-w-5xl px-8 py-10">
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Left section: action buttons - full width on mobile, half on lg+ */}
      <section>
        {/* Quick start buttons */}
      </section>

      {/* Right section: recent files, import queue, help - full width on mobile, half on lg+ */}
      <section className="space-y-6">
        {/* Additional sections */}
      </section>
    </div>
  </div>
</main>

<footer className="border-t border-border px-6 py-4">
  <div className="flex items-center justify-between text-sm text-muted-foreground">
    <p>{t("footer.built_with")}</p>
    <p>{t("footer.drag_drop")}</p>
    {/* System info hidden on mobile, shown md+ */}
    <p className="hidden md:inline-flex text-xs">
      {systemInfo.os} · {systemInfo.arch}
    </p>
  </div>
</footer>
```

**Key Details:**

- Full-width single column on mobile
- Two-column layout on lg (1024px+)
- Header tagline hidden on mobile (`sm:inline-flex`)
- System info footer hidden on mobile (`md:inline-flex`)
- Max width container (max-w-5xl) provides consistent reading width
- Consistent padding (px-8 py-10) on larger screens

</CodeSection>

<CodeSection>

## Code Section: Splash Screen Mobile Responsiveness

**File:** `components/splash-screen.tsx`
**Lines:** 1-114
**Purpose:** Loading screen with fixed viewport sizing and animations

```tsx
export function SplashScreen() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
      )}
    >
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-90 duration-1000 slide-in-from-bottom-10">
        <div className="relative mb-10 group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/40 blur-[80px] rounded-full animate-glow-slow" />

          {/* Icon - fixed size */}
          <div className="relative z-10 animate-float-slow">
            <Image
              src="/app-icon.png"
              alt="Readium Logo"
              width={160}
              height={160}
              className="h-40 w-40 object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        <div className="space-y-4 text-center relative z-10">
          {/* Text sizing not responsive - uses fixed h-40 w-40 for icon */}
          <h1 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 select-none">
            Readium
          </h1>
        </div>
      </div>
    </div>
  );
}
```

**Key Details:**

- Fixed-size icon (160x160px shown as h-40 w-40) - not responsive
- Full viewport covering (fixed inset-0)
- Text sizing not adaptive (text-6xl) - could be smaller on mobile
- Animations work uniformly across devices

</CodeSection>

<CodeSection>

## Code Section: Sidebar Width Initialization

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 164-173
**Purpose:** Responsive sidebar width defaults based on viewport

```tsx
const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
  // Load saved width from localStorage or use default
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

- Mobile sidebar default: 200px (< 640px viewport)
- Desktop sidebar default: sidebarInitialWidth (typically 280px)
- Sidebar width persisted to localStorage
- Sidebar resizable with constraints: min 180px, max 500px
- Sidebar resize handles on desktop only (no mouse support on mobile)

</CodeSection>

<CodeSection>

## Code Section: PDF Progress Bar Mobile Adaptation

**File:** `components/pdf-viewer/pdf-progress-bar.tsx`
**Lines:** 80-200
**Purpose:** Progress bar with mobile-specific sizing and visibility

```tsx
className={cn(
  alwaysShow ? "block" : "hidden sm:block",
  "sticky bottom-0 w-full border-t border-border bg-background/80 backdrop-blur-sm z-30"
)}

// Mobile vs Desktop sizing
"px-3 py-1.5 sm:px-4 sm:py-2",
"h-[56px] sm:h-[60px]",

// Responsive gaps
<div className="flex items-center justify-center gap-1 sm:gap-2">
  <span className="text-xs font-medium text-muted-foreground mr-1 sm:mr-2">
    {currentPage}
  </span>
</div>

// Mobile-specific page input sizing
className="w-12 sm:w-16 h-8 text-center text-xs sm:text-sm"

// Responsive text sizing
<span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
  / {numPages}
</span>

// Mobile-specific layout adjustments
<div className="mt-1 sm:mt-1.5 flex justify-between text-xs sm:text-sm text-muted-foreground">
```

**Key Details:**

- Mobile height: 56px, desktop: 60px
- Mobile padding: px-3 py-1.5, desktop: px-4 py-2
- Page input: w-12 on mobile, w-16 on desktop
- Text scaling: text-xs on mobile, text-sm on desktop
- Gap scaling: gap-1 on mobile, gap-2 on desktop
- Hidden by default on mobile unless `alwaysShow` prop

</CodeSection>

<CodeSection>

## Code Section: Settings Dialog Mobile Width

**File:** `components/pdf-viewer/pdf-settings-dialog.tsx`
**Lines:** 414
**Purpose:** Settings dialog with max-width constraint

```tsx
<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
  {/* Dialog tabs and content */}
  <Tabs defaultValue="display" className="flex-1 flex flex-col overflow-hidden mt-4">
    {/* Settings grid with responsive columns */}
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Settings controls */}
    </div>

    <div className="grid gap-6 lg:grid-cols-2 items-start">
      {/* More settings */}
    </div>
  </Tabs>
</DialogContent>
```

**Key Details:**

- Dialog max-width: 4xl (56rem)
- Height constraint: 90vh for mobile screens
- Single column on mobile, 2-column on sm+ for some sections
- LG breakpoint for additional grid variations
- Scrollable content overflow with `overflow-y-auto`

</CodeSection>

### Responsive Tailwind Breakpoints Used

Documented breakpoints found throughout the codebase:
- `sm` (640px): Mobile-to-tablet threshold
- `md` (768px): Tablet-to-desktop threshold
- `lg` (1024px): Large desktop threshold
- `xl` (1280px): Extra-large desktop threshold

### Touch Gesture Integration

**File:** `components/pdf-viewer/pdf-viewer.tsx` **Lines:** 1207-1223

```tsx
useTouchGestures(touchContainerRef, {
  onSwipeLeft: () => {
    if (viewMode === "single") {
      nextPage();
    }
  },
  onSwipeRight: () => {
    if (viewMode === "single") {
      previousPage();
    }
  },
  onPinchZoom: (scale) => {
    const currentZoom = zoom;
    const newZoom = Math.min(Math.max(currentZoom * scale, 0.5), 3.0);
    setZoom(newZoom);
  },
});
```

- Swipe gestures integrated for page navigation in single-page view
- Pinch zoom integrated with viewport zoom (0.5-3.0 range)
- Touch interactions only effective in single view mode

---

## Findings Section

### Current Mobile-Specific Implementations

1. **Dedicated Mobile Toolbar** (`pdf-mobile-toolbar.tsx`):
   - Compact toolbar optimized for small screens
   - Hidden on sm+ breakpoint (640px+)
   - Orientation-aware sizing and padding
   - Safe area padding for notched devices

2. **Device Orientation Hook** (`use-device-orientation.ts`):
   - Real-time orientation detection with window.matchMedia
   - Hardcoded 640px mobile breakpoint
   - Tracks both orientation and viewport dimensions

3. **Touch Gesture Support** (`use-touch-gestures.ts`):
   - Pinch zoom with scale calculation
   - Swipe navigation (left/right/up/down)
   - 50px minimum swipe distance threshold
   - Integrated with PDF viewer for page turning

4. **Sidebar Positioning Strategy**:
   - Mobile: Absolute positioning (overlays content)
   - Desktop (sm+): Relative positioning (alongside content)
   - Responsive width defaults: 200px mobile, 280px desktop
   - Smooth transitions with translate and opacity

5. **Toolbar Breakpoint Hierarchy**:
   - Mobile (< 640px): Essential controls only (close, menu, settings)
   - Tablet (640px+): Adds search, download, annotations
   - Desktop (768px+): Adds rotation, dark mode controls
   - Large (1024px+): Adds view mode options
   - Extra-large (1280px+): Adds fit mode options

### Areas Lacking Proper Mobile Responsiveness

1. **Splash Screen Icon Sizing**:
   - Fixed h-40 w-40 (160x160px) icon not responsive
   - Text-6xl heading size fixed - too large for small phones
   - Should scale based on viewport height

2. **Bottom Bar Padding Inconsistency**:
   - Bottom padding: 20px portrait, 12px landscape, 16px desktop
   - No account for notched devices beyond safe area padding
   - May cause content cutoff on very large notches

3. **PDF Page Rendering Without Mobile Optimization**:
   - Continuous and two-page view modes designed for desktop
   - No detection to force single-page mode on mobile
   - No lazy-loading optimization specific to mobile viewport

4. **Sidebar Resize Handle Not Mobile-Aware**:
   - Sidebar resizable with mouse interactions (drag from handle)
   - No touch-based resize capability
   - No mobile-specific preset widths

5. **Settings Dialog Width Not Fully Responsive**:
   - Fixed max-w-4xl (56rem) - too wide for small phones
   - Should use max-w-full or max-w-screen-sm on mobile
   - Grid layouts default to single column but could be better optimized

6. **AI Sidebar Overlay Issues**:
   - AI sidebar uses absolute positioning on mobile
   - No auto-dismiss behavior when opening
   - Can cover entire viewport with no escape mechanism

7. **Hardcoded Font Sizes in Key Areas**:
   - Some components use fixed text-xs, text-sm without responsive variants
   - Page number input width fixed to 12px on mobile
   - Progress bar adjustments minimal between breakpoints

8. **Mobile Landscape Not Fully Optimized**:
   - Orientation hook detects landscape but limited usage
   - Toolbar height adjusts (12px vs 14px) but insufficient
   - No landscape-specific layout strategies in main content area

9. **Gesture Minimum Distance Not Configurable**:
   - Swipe detection hardcoded to 50px minimum
   - No adjustment for screen size or device capability
   - May be too strict on small phones, too lenient on tablets

10. **Dialog Components Without Mobile Constraints**:
    - DialogContent uses fixed max-width classes (max-w-2xl, max-w-4xl)
    - Some dialogs exceed available viewport width on small phones
    - No horizontal padding for edge-to-edge on mobile

### Specific Files Needing Mobile Optimization

**High Priority:**

1. `components/splash-screen.tsx` (lines 82-102):
   - Icon sizing hardcoded, should scale responsively
   - Heading text-6xl too large for mobile
   - Recommend: Use responsive sizing with mobile-first approach

2. `components/pdf-viewer/pdf-viewer.tsx` (lines 164-173):
   - No consideration for very small viewports (< 320px)
   - Sidebar minimum 180px width may be excessive on small phones
   - Recommend: Dynamic minimum based on viewport width

3. `components/pdf-viewer/pdf-toolbar.tsx` (lines 440-664):
   - Search bar not available on mobile
   - Button groups hidden entirely rather than reorganized
   - Recommend: Consolidate into dropdown menu on mobile

**Medium Priority:**

4. `components/welcome-page/welcome-page.tsx` (lines 531-532):
   - Dialog max-width-2xl may be too wide for mobile phones in portrait
   - Recommend: Use responsive max-width with mobile-specific constraint

5. `components/pdf-viewer/pdf-settings-dialog.tsx` (line 414):
   - max-w-4xl dialog too wide for phones
   - Recommend: max-w-full sm:max-w-4xl

6. `hooks/use-device-orientation.ts` (line 14):
   - Mobile breakpoint hardcoded; consider making configurable
   - Consider adding tablet breakpoint (768px)

**Low Priority:**

7. `components/pdf-viewer/pdf-progress-bar.tsx` (lines 84-88):
   - Minimal padding adjustments between breakpoints
   - Could be more aggressive with space savings
   - Recommend: Even smaller padding on mobile (px-2 py-1)

### Touch Interaction Coverage

**Implemented:**
- Swipe left/right for page navigation
- Pinch zoom for document zoom
- Orientation change detection

**Not Implemented:**
- Long-press for context menu
- Two-finger tap for zoom out
- Pull-to-refresh pattern
- Touch-based sidebar resizing
- Gesture-based toolbar access

### Responsive Pattern Summary

| Aspect | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Toolbar Layout | Single row, compact | Single row, medium | Single row, full |
| Sidebar Position | Absolute (overlay) | Relative | Relative |
| Sidebar Width | 200px | 200-240px | 280px |
| View Modes | Single only | All | All |
| Bottom Padding | 20px (portrait), 12px (landscape) | 16px | 16px |
| Breakpoint | < 640px | 640-1024px | > 1024px |

### Responsive Patterns Observed

1. **Breakpoint Prevalence**: Most responsive logic clusters around sm (640px) breakpoint
2. **Content Priority**: Higher-value tools hidden on mobile, essential controls always visible
3. **Sidebar Strategy**: Overlay on mobile to save space, fixed-width on desktop for constant visibility
4. **Spacing Scaling**: Consistent pattern of reducing gaps/padding on mobile (gap-1 vs gap-2, px-3 vs px-4)
5. **Hidden Elements**: Heavy use of `hidden sm:block` and `hidden md:flex` patterns

