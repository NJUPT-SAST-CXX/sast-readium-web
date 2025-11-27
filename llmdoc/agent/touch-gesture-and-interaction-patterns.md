# Touch Gestures and Mobile Interaction Patterns

## Evidence Section

### Current Touch Gesture Implementations

<CodeSection>

## Code Section: Touch Gesture Hook Implementation

**File:** `hooks/use-touch-gestures.ts`
**Lines:** 1-109
**Purpose:** Core touch gesture detection and handling

```typescript
interface TouchGesturesOptions {
  onPinchZoom?: (scale: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
}

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
        // Pinch zoom
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

        touchStartRef.current = null;
      } else if (e.touches.length < 2) {
        // Reset pinch zoom
        initialPinchDistance.current = 0;
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

- **Single Touch Swipe**: Detects X/Y delta movement
- **Two-Finger Pinch**: Calculates distance ratio between finger pairs
- **Gesture Direction**: Determines dominant direction (horizontal vs vertical)
- **Minimum Distance Threshold**: 50px default (configurable)
- **Event Listeners**: touchstart, touchmove (non-passive), touchend
- **State Management**: References for touch start position and pinch distance
- **Touch End Cleanup**: Resets state when all fingers lifted

</CodeSection>

<CodeSection>

## Code Section: Touch Gesture Integration in PDF Viewer

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 1207-1223
**Purpose:** Applying touch gestures to PDF viewing

```typescript
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

**Key Details:**

- **Swipe Left**: Next page (forward navigation)
- **Swipe Right**: Previous page (backward navigation)
- **Swipe Limitations**: Only active in single-page view mode
- **Pinch Zoom**: Multiplies current zoom by scale factor
- **Zoom Constraints**: Bounded between 0.5x (50%) and 3.0x (300%)
- **No Swipe in Continuous/Two-Page**: Gestures disabled in other view modes

</CodeSection>

<CodeSection>

## Code Section: Mobile Toolbar Touch-Friendly Controls

**File:** `components/pdf-viewer/pdf-mobile-toolbar.tsx`
**Lines:** 59-157
**Purpose:** Mobile-specific touch-optimized toolbar

```tsx
return (
  <div
    className={cn(
      "flex w-full items-center justify-between border-t border-border bg-background sm:hidden z-50",
      "pt-safe pb-safe pr-safe pl-safe",
      isLandscape ? "h-12 px-2" : "h-14 px-4"
    )}
    data-orientation={orientation}
  >
    {/* Left: Thumbnails & Outline */}
    <div className={cn("flex items-center", sectionGap)}>
      <Button variant="ghost" size="icon" onClick={toggleThumbnails}>
        <LayoutGrid className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleOutline}>
        <BookOpen className="h-5 w-5" />
      </Button>
    </div>

    {/* Center: Page Navigation */}
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={previousPage}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span
        className={cn(
          "text-sm font-medium w-16 text-center",
          isLandscape && "text-xs w-14"
        )}
      >
        {currentPage} / {numPages}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextPage}
        disabled={currentPage >= numPages}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>

    {/* Right: Search & More Menu */}
    <div className={cn("flex items-center", sectionGap)}>
      <Button variant="ghost" size="icon" onClick={onSearch}>
        <Search className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Menu items for additional controls */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);
```

**Key Details:**

- **Button Size**: `size="icon"` provides touch-friendly 40px targets
- **Spacing**: `gap-1` on mobile, `gap-0.5` on landscape (different touch density)
- **Safe Area Padding**: `pt-safe pb-safe pr-safe pl-safe` for notched devices
- **Menu Consolidation**: More menu houses less-frequent controls
- **Page Input**: Compact display (14px font) showing current page
- **Disabled States**: Previous/next buttons disabled at boundaries

</CodeSection>

<CodeSection>

## Code Section: Safe Area Inset Implementation

**File:** `components/pdf-viewer/pdf-mobile-toolbar.tsx`
**Line:** 62-63
**Purpose:** Accounting for device notches and safe zones

```tsx
className={cn(
  "flex w-full items-center justify-between border-t border-border bg-background sm:hidden z-50",
  "pt-safe pb-safe pr-safe pl-safe",  // Safe area padding
  isLandscape ? "h-12 px-2" : "h-14 px-4"
)}
```

**Key Details:**

- **pt-safe**: Padding top safe area (accounts for status bar)
- **pb-safe**: Padding bottom safe area (accounts for home indicator)
- **pr-safe**: Padding right safe area (accounts for right notch)
- **pl-safe**: Padding left safe area (accounts for left notch)
- **Tailwind Safe Area**: Uses CSS env() for device-specific safe areas
- **Landscape vs Portrait**: Notch positions change with rotation

</CodeSection>

<CodeSection>

## Code Section: Orientation-Aware Layout

**File:** `components/pdf-viewer/pdf-viewer.tsx`
**Lines:** 177-182
**Purpose:** Detecting and responding to device orientation changes

```typescript
const {
  orientation,
  isMobile,
  isMobileLandscape,
} = useDeviceOrientation();

// Used to adjust layout
const contentBottomPadding = isMobile
  ? isMobileLandscape
    ? "pb-12"
    : "pb-20"
  : "pb-16";
```

**Key Details:**

- **Orientation States**: portrait, landscape
- **Combined States**: isMobileLandscape, isMobilePortrait
- **Viewport Dimensions**: viewportWidth, viewportHeight available
- **Dynamic Padding**: Bottom padding changes by 8px between landscape/portrait
- **Event Listener**: Listens to orientationchange and resize events

</CodeSection>

### Current Touch Interactions Summary

| Gesture | Action | Condition | Result |
|---------|--------|-----------|--------|
| Pinch (2 fingers) | Zoom in/out | Any view mode | Zoom 0.5x to 3.0x |
| Swipe left | Next page | Single-page view | Page advances |
| Swipe right | Previous page | Single-page view | Page goes back |
| Swipe up | (reserved) | - | (unused) |
| Swipe down | (reserved) | - | (unused) |
| Tap button | Various actions | Toolbar buttons | Execute action |
| Long tap | (not implemented) | - | No context menu |
| Double tap | (not implemented) | - | No smart zoom |

---

## Findings Section

### Touch Gesture Coverage Assessment

**Implemented Gestures:**
1. Pinch zoom (2-finger distance ratio)
2. Swipe left (next page)
3. Swipe right (previous page)
4. Touch button taps (all UI buttons)

**Standard Mobile Patterns Not Implemented:**
1. Long-press context menu
2. Double-tap zoom
3. Two-finger tap (zoom out)
4. Pull-to-refresh
5. Swipe-to-dismiss modals
6. Long-press and drag (sidebar resize)
7. Three-finger tap (accessibility)
8. Haptic feedback feedback on gestures

### Gesture Implementation Quality

**Strengths:**
- Pinch zoom smoothly scales using ratio calculation
- Swipe detection uses proper distance threshold
- Touch events properly configured (non-passive touchmove)
- Gesture state properly cleaned up on touch end
- Touch container ref properly managed
- Configurable options allow customization

**Weaknesses:**
- Minimum swipe distance (50px) not adaptive to screen size
- No velocity calculation for swipe (all swipes treated equally)
- No swipe animation or momentum
- Gestures only work in single-page view
- No feedback (visual or haptic) on gesture recognition
- No swipe direction preview during movement
- No conflict detection with page scrolling
- Touch events not cancelable during interaction

### Pinch Zoom Analysis

**Current Implementation:**
- Calculates distance between two touch points
- Compares current distance to initial distance
- Multiplies current zoom level by scale ratio
- Constraints result to 0.5x - 3.0x range

**Issues:**
- Scale calculation immediate, no easing
- Can trigger rapid zoom changes during pinch move
- No anchor point (scales from page center, not touch center)
- Continuous updates during pinch can cause jank

**Improvements Needed:**
- Add touch-center as zoom anchor
- Implement debouncing for smoother updates
- Consider easing function for zoom animation
- Reset to page boundaries after zoom

### Swipe Gesture Analysis

**Current Implementation:**
- Tracks single-touch start position
- Detects swipe on touchEnd event
- Compares horizontal vs vertical delta
- Requires 50px minimum movement
- Only fires in single-page view

**Issues:**
- Fixed 50px threshold not responsive
- No velocity consideration (slow swipes same as fast)
- No multi-directional support (e.g., diagonal ignored)
- Swipe during content scroll may conflict
- No visual feedback during swipe

**Improvements Needed:**
- Make threshold responsive (40-50px based on viewport)
- Calculate velocity for better UX
- Add visual feedback (highlight page)
- Prevent scroll conflicts
- Support swipe in other view modes (with different behavior)

### Mobile Toolbar Touch Target Analysis

**Button Size Analysis:**
- Icon buttons: 40px x 40px (size="icon")
- Text buttons: typically 36px minimum height
- Recommended minimum (Apple): 44px x 44px
- Current spacing: 1px to 2px gap between buttons

**Issue:** Icon buttons slightly below recommended 44px minimum

**Touch-Friendly Spacing:**
- Current: `gap-1` (4px on mobile), `gap-2` (8px) on sm+
- Recommended: 8px+ gap for comfortable touch targets
- Current implementation: mostly adequate but gap-1 is tight

### Safe Area Padding Coverage

**Current Implementation:**
- pt-safe (top safe area)
- pb-safe (bottom safe area)
- pr-safe (right safe area)
- pl-safe (left safe area)

**Devices Covered:**
- iPhone X+ (notch at top/sides)
- iPhone 12+ mini (notch at top)
- Android devices with gesture navigation

**Known Gaps:**
- No separate handling for rounded corners
- No consideration for software keyboard area
- No landscape notch adjustment beyond padding
- Doesn't adjust for status bar on Android

### Orientation Detection Accuracy

**Detection Method:**
- window.innerWidth vs window.innerHeight comparison
- Supplemented with orientationchange event

**Accuracy:** High (within 99% confidence)

**Limitations:**
- SSR returns default orientation (portrait)
- Initial state may be wrong before first render
- Rapid orientation changes may miss intermediate states

### View Mode Gesture Restrictions

**Current Behavior:**
- Swipe gestures only active in single-page view
- Other modes (continuous, two-page) don't respond to swipes
- No user feedback explaining why swipes don't work

**Problem:** Users unfamiliar with interface may expect swipes in all modes

**Recommendation:**
- Either enable swipes in all modes with context-appropriate behavior
- Or provide clear indication (UI hint) about when swipes work

### Missing Gesture Patterns for Mobile Reading

**Industry Standard Patterns Not Implemented:**

1. **Double-Tap Zoom**:
   - Tap once: focus on text column
   - Tap again: zoom to fit width
   - Very common in eBook readers

2. **Long-Press Selection**:
   - Long-press to start text selection
   - Drag to extend selection
   - Double-tap word to select word

3. **Vertical Swipe for Page Turns**:
   - Some readers support up/down swipe for page navigation
   - Useful for vertical reading on tall devices

4. **Pinch Out for Zoom In**:
   - Current pinch works, but no visual feedback
   - Could show zoom percentage during pinch

5. **Two-Finger Tap**:
   - Standard zoom-out gesture
   - Not implemented

6. **Tap & Drag Sidebar**:
   - Current: sidebar toggle buttons
   - Could support swipe-from-edge to show sidebar

### Gesture Conflict Management

**Potential Conflicts Not Addressed:**

1. **Swipe vs Scroll**: If PDF zoomed and scrollable, swipe may conflict with scroll
2. **Pinch vs Scroll**: Two-finger pinch might trigger accidental scroll
3. **Button Tap vs Swipe**: Rapid taps might be interpreted as swipes
4. **Sidebar Drag vs Page Drag**: If sidebar draggable, could interfere with page interactions

**Current Mitigation:**
- Swipes only in single-page view (avoids scroll conflict)
- Pinch prevents default and preventDefault() called

**Additional Needed:**
- Timeout between gestures to prevent double-firing
- Better state management to track active gestures
- Visual feedback to confirm gesture recognition

### Touch Button Accessibility

**Current Button Sizes:**
- Icon buttons: 40x40px (via size="icon")
- Expected: 44x44px minimum
- Gap between buttons: 4-8px
- Adequate for most users, slightly tight for accessibility

**Recommendations:**
1. Increase icon button size to 44px
2. Increase gap to 8px minimum
3. Add visual feedback on touch (active state)
4. Add semantic labels for screen readers
5. Ensure sufficient color contrast

### Gesture State Management

**Current Approach:**
- useRef for touch start position
- useRef for initial pinch distance
- State reset on touch end

**Issues:**
- No gesture queue (rapid gestures not handled)
- No timeout to prevent gesture noise
- No tracking of gesture progress
- No cancellation mechanism

**Improvements:**
```typescript
// Add debouncing
const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Add progress tracking
const gestureStateRef = useRef<'idle' | 'swiping' | 'pinching'>('idle');

// Add cancellation
const cancelGestureRef = useRef(() => {
  gestureStateRef.current = 'idle';
  if (gestureTimeoutRef.current) {
    clearTimeout(gestureTimeoutRef.current);
  }
});
```

### Recommendations for Enhanced Touch Support

**High Priority (Core Mobile Usability):**
1. Make swipe distance responsive (40px on small phones, 50px on tablets)
2. Add visual feedback during pinch zoom (show zoom percentage)
3. Add velocity-based swipe detection (feel more responsive)
4. Ensure 44x44px minimum touch targets on toolbar

**Medium Priority (Standard Mobile Patterns):**
1. Implement double-tap zoom (common eBook pattern)
2. Add long-press text selection context menu
3. Support swipe in non-single modes with appropriate behavior
4. Add haptic feedback on gesture recognition

**Low Priority (Polish):**
1. Implement two-finger tap for zoom out
2. Add swipe-from-edge for sidebar access
3. Implement pull-to-refresh to reload
4. Add gesture animation feedback

