# shadcn/ui Component Usage Analysis

## Part 1: Evidence

### Current shadcn/ui Components in `/components/ui/`

The project contains 28 shadcn/ui component files:

<CodeSection>

## Code Section: Available UI Components List

**File:** `components/ui/` directory
**Count:** 28 components

**Components:**
1. accordion.tsx
2. alert.tsx
3. badge.tsx
4. button.tsx
5. button-group.tsx (custom extension)
6. card.tsx
7. checkbox.tsx
8. collapsible.tsx
9. command.tsx
10. dialog.tsx
11. dropdown-menu.tsx
12. hover-card.tsx
13. input.tsx
14. input-group.tsx (custom extension)
15. kbd.tsx
16. label.tsx
17. popover.tsx
18. progress.tsx
19. scroll-area.tsx
20. select.tsx
21. separator.tsx
22. slider.tsx
23. sonner.tsx
24. spinner.tsx
25. switch.tsx
26. tabs.tsx
27. textarea.tsx
28. tooltip.tsx

</CodeSection>

### Component Usage Across Codebase

**Import Statistics:**
- PDF Viewer Components: 71 imports from `@/components/ui/`
- AI Elements: 33 imports from `@/components/ui/`
- Welcome Page: 5 imports from `@/components/ui/`
- Other Components: Additional imports

<CodeSection>

## Code Section: High-Usage Components

**File:** Multiple components across codebase
**Purpose:** Core UI building blocks

**Most Frequently Used Components:**
1. **Button** - Used extensively in pdf-toolbar, welcome-page, ai-sidebar, pdf-annotation-layer
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\pdf-toolbar.tsx` (lines 37, 253-850+)
   - Example: `D:\Project\sast-readium-web\components\welcome-page\welcome-page.tsx` (lines 14, 539-840+)

2. **Dialog & DialogContent** - Used in pdf-settings-dialog, welcome-page folder dialogs
   - Example: `D:\Project\sast-readium-web\components\welcome-page\welcome-page.tsx` (lines 16-22, 735-841)
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\keyboard-shortcuts-dialog.tsx` (lines 4-9, 84-130)

3. **Tooltip, TooltipTrigger, TooltipContent** - Extensively used for interactive hints
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\pdf-toolbar.tsx` (lines 47-51, 265-850+)
   - Used in pdf-annotations-toolbar, annotation-color-picker

4. **Input & Label** - Form inputs in multiple locations
   - Example: `D:\Project\sast-readium-web\components\welcome-page\welcome-page.tsx` (lines 25, 771-776)
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\pdf-go-to-page.tsx` (lines 12-13)

5. **Select** - Zoom level selector, view mode selection
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\pdf-toolbar.tsx` (lines 39-45, 462-478)

6. **Tabs** - Used in ai-sidebar for organizing panels
   - Example: `D:\Project\sast-readium-web\components\ai-sidebar\ai-sidebar.tsx` (line 7)

7. **ScrollArea** - Used for scrollable content regions
   - Example: `D:\Project\sast-readium-web\components\pdf-viewer\keyboard-shortcuts-dialog.tsx` (lines 10, 90-127)
   - Example: `D:\Project\sast-readium-web\components\welcome-page\welcome-page.tsx` (line 23, 797-818)

8. **Badge** - Used in AI elements for status indicators
   - Example: `D:\Project\sast-readium-web\components\ai-elements\chain-of-thought.tsx` (line 4)

9. **Card** - Layout components in ai-sidebar and about page
   - Example: `D:\Project\sast-readium-web\components\ai-sidebar\research-workflow.tsx` (line 9)

10. **Checkbox** - Used in folder selection dialogs
    - Example: `D:\Project\sast-readium-web\components\welcome-page\welcome-page.tsx` (lines 24, 899-902)

</CodeSection>

### Custom Extensions to shadcn/ui

<CodeSection>

## Code Section: ButtonGroup Custom Component

**File:** `components/ui/button-group.tsx`
**Lines:** 1-83
**Purpose:** Groups multiple buttons with unified styling and border management

```typescript
const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal: "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical: "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)
```

**Key Details:**
- Custom CVA variant-based styling for button groups
- Supports horizontal and vertical orientation
- Removes borders between adjacent buttons
- Provides ButtonGroupText and ButtonGroupSeparator sub-components
- Used extensively in pdf-toolbar for grouping related controls

</CodeSection>

<CodeSection>

## Code Section: InputGroup Custom Component

**File:** `components/ui/input-group.tsx`
**Lines:** 1-170
**Purpose:** Groups input elements with addon buttons and text

```typescript
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none",
        "h-9 min-w-0 has-[>textarea]:h-auto",
        // Variants for alignment and state...
      )}
      {...props}
    />
  )
}
```

**Key Details:**
- Supports InputGroupInput, InputGroupTextarea, InputGroupButton, InputGroupAddon, InputGroupText
- Used in prompt-input component for advanced input scenarios
- Provides styling for different alignments (inline-start, inline-end, block-start, block-end)

</CodeSection>

<CodeSection>

## Code Section: Spinner Custom Component

**File:** `components/ui/spinner.tsx`
**Lines:** 1-16
**Purpose:** Loading indicator using Lucide's Loader2Icon

```typescript
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}
```

**Key Details:**
- Simple wrapper around Loader2Icon
- Used in pdf-thumbnail (line 309 in pdf-thumbnail.tsx)
- Could be extended with multiple animation states

</CodeSection>

### Component Usage Patterns

<CodeSection>

## Code Section: Tooltip Usage Pattern

**File:** `components/pdf-viewer/pdf-toolbar.tsx`
**Lines:** 47-51, 206-950
**Purpose:** Accessibility and UX enhancement for toolbar controls

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Usage pattern
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" onClick={...}>
        <ZoomOut className="h-5 w-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <div className="text-xs">
        <div>{t("toolbar.tooltip.zoom_out")}</div>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Key Details:**
- Extensively used for all icon buttons in toolbar (50+ instances)
- Provides keyboard shortcut hints in tooltip content
- Consistent pattern throughout pdf-viewer components
- Each tooltip group is wrapped with TooltipProvider at component level

</CodeSection>

<CodeSection>

## Code Section: Dialog Usage Pattern

**File:** `components/welcome-page/welcome-page.tsx`
**Lines:** 735-841
**Purpose:** Modal dialogs for folder selection and file management

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Usage in folder selection
<Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
  <DialogContent className="max-h-[80vh] max-w-2xl">
    <DialogHeader>
      <DialogTitle>{t("dialog.select_pdf")}</DialogTitle>
      <DialogDescription>{t("dialog.scan_desc")}</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Key Details:**
- Used for file selection, settings, and keyboard shortcuts dialogs
- Supports header, footer, and scrollable content areas
- Combined with ScrollArea for large content

</CodeSection>

### Potentially Unused Components

<CodeSection>

## Code Section: Sonner Toast Component Status

**File:** `components/ui/sonner.tsx`
**Lines:** 1-40
**Purpose:** Toast/notification system wrapper

```typescript
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Styling...
    />
  )
}
```

**Key Details:**
- Configured but not imported in any component files
- Part of the codebase infrastructure (would be in layout.tsx or app root)
- Ready for use but currently not actively utilized in visible components

</CodeSection>

### Custom Implementations That Could Use shadcn/ui

<CodeSection>

## Code Section: AnnotationColorPicker Custom Implementation

**File:** `components/pdf-viewer/annotation-color-picker.tsx`
**Lines:** 1-82
**Purpose:** Color selection for PDF annotations

```typescript
const PRESET_COLORS = [
  { name: "Yellow", value: "#ffff00" },
  { name: "Orange", value: "#ff9800" },
  // ... 10 more colors
];

export function AnnotationColorPicker({
  selectedColor,
  onColorChange,
  className,
}: AnnotationColorPickerProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onColorChange(color.value)}
                  className={cn("h-5 w-5 rounded border-2 transition-all hover:scale-110", ...)}
                  style={{ backgroundColor: color.value }}
                />
              ))}
              <input type="color" />
            </div>
          </TooltipTrigger>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
```

**Key Details:**
- Custom implementation using Tooltip from shadcn/ui
- Could benefit from a dedicated Popover component for better UX
- Could be wrapped in Popover for persistent color selection UI
- Currently uses inline buttons with Tooltip

</CodeSection>

<CodeSection>

## Code Section: Signature Dialog Custom Implementation

**File:** `components/pdf-viewer/signature-dialog.tsx`
**Lines:** 1-100+ (estimated)
**Purpose:** Signature capture UI for PDF annotation

**Key Details:**
- Uses Dialog from shadcn/ui but custom signature canvas implementation
- Drawing canvas is custom implementation
- Could benefit from standardization of dialog patterns

</CodeSection>

## Part 2: Findings and Conclusions

### Current Implementation Status

The SAST Readium project has a well-structured shadcn/ui integration with 28 components installed. The implementation shows:

1. **Core Components Fully Utilized**: Button, Dialog, Input, Select, Tooltip, Tabs, ScrollArea, and Card are heavily used throughout the application, demonstrating good adoption of shadcn/ui patterns.

2. **Custom Extensions Present**: The project extends shadcn/ui with custom components (ButtonGroup, InputGroup, Spinner) that provide specialized functionality beyond the base library. These extensions are well-integrated and follow shadcn/ui conventions.

3. **Consistent Patterns**: Components follow standardized patterns, particularly in pdf-toolbar where Tooltip wrapping is consistent across 50+ button instances. Dialog usage is standardized with header/footer/content structure.

4. **Component Distribution**: PDF viewer components make the heaviest use of UI components (71 imports), followed by AI elements (33 imports), with welcome page using 5 direct imports plus additional Dialog and ScrollArea usage.

### Missing Components

The analysis identifies several commonly needed shadcn/ui components not currently installed:

1. **Drawer** - Would be useful for mobile sidebar navigation in pdf-viewer or AI chat panel
2. **Sheet** - Alternative to drawer for side panels
3. **Pagination** - If page navigation needs dedicated component (currently managed in toolbar)
4. **Context Menu** - Not found; could replace custom right-click menu implementations
5. **Toast** - Sonner is installed but not actively used in components
6. **Breadcrumb** - Navigation component for document structure
7. **Combobox** - Advanced search/selection (Popover + Command are used instead)
8. **Sidebar** - Would help organize ai-sidebar layout

### Components Requiring Migration or Enhancement

1. **AnnotationColorPicker**: Could be replaced with Popover + custom color grid for better UX and persistent interaction
2. **Custom dropdown implementations**: Any dropdown menus are using DropdownMenu correctly from shadcn/ui
3. **Modal dialogs**: Could benefit from consistent use of Dialog + Drawer pattern for responsive design

### Custom Component Analysis

The three custom components in `/components/ui/` are appropriately designed extensions:

1. **ButtonGroup** - Fills a legitimate gap in grouping related buttons with proper focus management and responsive orientation
2. **InputGroup** - Provides sophisticated input composition patterns not available in base shadcn/ui
3. **Spinner** - Simple convenience wrapper that could be enhanced with size/speed variants

### Component Configuration Compliance

The project properly configures shadcn/ui with:
- Style: "new-york"
- Icon Library: "lucide" (properly integrated with Lucide icons)
- CSS Variables: Enabled
- Tailwind CSS integration: Configured
- TypeScript: Enabled
- RSC: Enabled

### Usage Recommendations

1. **High Priority**: Consider adding Drawer component for mobile-friendly side navigation in pdf-toolbar and ai-sidebar
2. **Medium Priority**: Implement Toast notifications using the already-installed Sonner component for user feedback
3. **Enhancement**: Refactor AnnotationColorPicker to use Popover for better interaction patterns
4. **Consistency**: Ensure all custom input scenarios use InputGroup pattern for unified UX

### Conclusion

The project demonstrates mature shadcn/ui adoption with good component utilization patterns. The custom extensions are well-designed and necessary. The main opportunity for enhancement is activating the Sonner toast system and potentially adding mobile-focused components like Drawer. No critical gaps exist in current component availability, and the implemented patterns are consistent with shadcn/ui best practices.
