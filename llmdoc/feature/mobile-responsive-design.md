# Mobile and Responsive Design Implementation

## 1. Purpose

This feature ensures SAST Readium provides an optimal user experience across all device sizes and orientations. The implementation uses mobile-first responsive design principles, adaptive UI components, and touch-optimized gestures to create a seamless experience on smartphones, tablets, and desktops.

## 2. How it Works

### 2.1 Responsive Dialog Widths

Dialogs use a mobile-first responsive width pattern that scales from 95% viewport width on mobile to larger fixed widths on desktop:

```
max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl
```

**Affected Components:**
- PDF Settings Dialog
- Keyboard Shortcuts Dialog
- Signature Dialog
- Welcome Page Dialog

This pattern ensures dialogs don't get cut off on small screens while maintaining optimal readability on large displays.

### 2.2 Bottom Sheet Drawer for Mobile

The shadcn/ui Drawer component (built on Vaul library) provides native bottom sheet behavior on mobile devices:

**AI Sidebar Mobile Adaptation:**
- Detects mobile breakpoint: `window.innerWidth < 640`
- On mobile (< 640px): Renders as bottom Drawer with 85vh height
- On desktop (>= 640px): Renders as traditional side panel with resize handle
- Window resize listener dynamically switches between modes

**Implementation Pattern:**
```
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 640);
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);
```

### 2.3 Enhanced Touch Gestures

The `useTouchGestures` hook provides comprehensive touch interaction support with configurable delays:

**Supported Gestures:**
- **Pinch Zoom:** Scales between two-finger distances
- **Swipe:** Detects left/right/up/down with configurable minimum distance (default 50px)
- **Double-Tap:** Consecutive taps within configurable delay (default 300ms)
- **Long-Press:** Sustained touch for configurable duration (default 500ms)

**Gesture Callbacks:**
```typescript
interface TouchGesturesOptions {
  onPinchZoom?: (scale: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  minSwipeDistance?: number;    // default: 50
  doubleTapDelay?: number;       // default: 300ms
  longPressDelay?: number;       // default: 500ms
}
```

**Key Features:**
- Long-press timer cancellation on movement detection (> 10px threshold)
- Prevention of tap/swipe processing when long-press is active
- Double-tap proximity check (50px radius) to avoid accidental double triggers
- Pinch zoom activation only on 2-finger touch

### 2.4 PDF Context Menu

New context menu component triggered by long-press on mobile (or right-click on desktop):

**Features:**
- Viewport-aware positioning: Stays within screen bounds with 16px padding
- Menu actions: Copy, Highlight, Add Comment, Add Bookmark
- Integration with Sonner toast for feedback
- Conditional rendering of copy button (only if text is selected)

**Positioning Algorithm:**
- Detects if menu would exceed right edge: `x + menuWidth > viewportWidth - 16`
- Detects if menu would exceed bottom edge: `y + menuHeight > viewportHeight - 16`
- Applies 16px minimum padding from screen edges

### 2.5 Mobile Toolbar Enhancements

The PDF Mobile Toolbar includes:
- **AI Button:** Opens AI Sidebar drawer on mobile
- **Dropdown Menu:** Additional options for bookmarks and comments
- **Responsive Icons:** Adapts spacing and sizing for touch targets
- **Callback Pattern:** Extensible design for feature integration

### 2.6 Splash Screen Responsive Sizing

Logo and text scale responsively with Tailwind breakpoints:

```
Logo: h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40
Text: text-3xl sm:text-4xl md:text-6xl
```

### 2.7 Toast Theme Detection

Sonner Toaster component detects theme from `usePDFStore`:
- Reads `isDarkMode` state from PDF store
- Applies theme: `isDarkMode ? "dark" : "light"`
- Custom CSS variables for popover-based styling
- Position: bottom-right (respects viewport on mobile)

### 2.8 Translation Support

Context menu and mobile-specific strings are localized:

**Translation Keys:**
- `context_menu.title` - Menu header
- `context_menu.copy` - Copy action
- `context_menu.highlight` - Highlight action
- `context_menu.add_comment` - Comment action
- `context_menu.add_bookmark` - Bookmark action
- `context_menu.copied` - Success toast
- `context_menu.copy_failed` - Error toast
- `context_menu.highlight_mode` - Feedback toast
- `context_menu.comment_mode` - Feedback toast
- `context_menu.bookmark_prefix` - Bookmark title prefix
- `context_menu.bookmark_added` - Success toast

## 3. Relevant Code Modules

- `/components/pdf-viewer/pdf-context-menu.tsx` - Context menu component with viewport detection
- `/components/ai-sidebar/ai-sidebar.tsx` - Mobile/desktop conditional rendering
- `/hooks/use-touch-gestures.ts` - Touch gesture detection and processing
- `/components/pdf-viewer/pdf-mobile-toolbar.tsx` - Mobile-specific toolbar
- `/components/pdf-viewer/pdf-settings-dialog.tsx` - Responsive dialog implementation
- `/components/pdf-viewer/keyboard-shortcuts-dialog.tsx` - Responsive dialog implementation
- `/components/pdf-viewer/signature-dialog.tsx` - Responsive dialog implementation
- `/components/welcome-page/welcome-page.tsx` - Responsive dialog implementation
- `/components/splash-screen.tsx` - Responsive sizing
- `/components/ui/sonner.tsx` - Theme-aware toast component
- `/lib/pdf-store.ts` - Stores isDarkMode state used by theme detection
- `/locales/en/translation.json` - English translations for context menu
- `/locales/zh/translation.json` - Chinese translations for context menu

## 4. Attention

- **Touch gesture delays:** Adjustable via options parameter but defaults (300ms double-tap, 500ms long-press) should be tested for accessibility compliance.
- **Mobile breakpoint:** Fixed at 640px (Tailwind `sm:` breakpoint). If changed, update `window.innerWidth < 640` check in AI Sidebar.
- **Context menu viewport detection:** Uses `window.innerWidth/innerHeight` which may vary on mobile with browser UI elements. Test on actual devices.
- **Drawer height:** Fixed at 85vh on mobile AI Sidebar. May need adjustment for devices with soft keyboards or notches.
- **Responsive classes:** Tailwind breakpoints used: `max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl`. Ensure consistent across all dialogs.
