# Coding Standards

This guide outlines the coding standards and best practices for contributing to SAST Readium.

## Language & Framework

- **TypeScript**: All code must be written in TypeScript
- **React 19**: Use React 19 features and patterns
- **Next.js 16**: Follow Next.js App Router conventions
- **Tailwind CSS v4**: Use utility-first CSS

## File Naming

### Components

- **PascalCase** for component files: `PDFViewer.tsx`, `Button.tsx`
- **kebab-case** for multi-word: `pdf-viewer.tsx`, `ai-sidebar.tsx`
- Match filename to default export

### Utilities

- **camelCase** for utility files: `pdfUtils.ts`, `aiService.ts`
- **kebab-case** alternative: `pdf-utils.ts`, `ai-service.ts`

### Tests

- Co-locate with source: `button.test.tsx` next to `button.tsx`
- Or use `__tests__/` directory for component groups

## Code Style

### TypeScript

```typescript
// ✅ Good: Explicit types for function parameters and returns
function calculateZoom(current: number, delta: number): number {
  return Math.max(0.5, Math.min(5, current + delta));
}

// ✅ Good: Interface for complex objects
interface PDFViewerProps {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

// ❌ Bad: Using `any`
function processData(data: any): any {
  return data;
}
```

### React Components

```tsx
// ✅ Good: Functional component with TypeScript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        variants[variant],
        sizes[size]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Hooks

```typescript
// ✅ Good: Custom hook with clear return type
function usePDFNavigation() {
  const currentPage = usePDFStore((state) => state.currentPage);
  const setCurrentPage = usePDFStore((state) => state.setCurrentPage);
  const numPages = usePDFStore((state) => state.numPages);

  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, numPages, setCurrentPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  return { currentPage, numPages, nextPage, previousPage };
}
```

## Import Organization

Order imports as follows:

```typescript
// 1. React and Next.js
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

// 3. Internal components
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/pdf-viewer/pdf-viewer";

// 4. Internal utilities and hooks
import { usePDFStore } from "@/lib/pdf-store";
import { cn } from "@/lib/utils";

// 5. Types (if separate)
import type { PDFMetadata } from "@/lib/pdf-store";

// 6. Styles (if any)
import "./styles.css";
```

## Component Structure

### File Organization

```tsx
// 1. Imports
import { useState } from "react";

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
}

// 3. Constants
const DEFAULT_VALUE = 10;

// 4. Helper functions (if small)
function formatTitle(title: string): string {
  return title.toUpperCase();
}

// 5. Component
export function Component({ title }: ComponentProps) {
  // State
  const [count, setCount] = useState(0);

  // Derived state
  const formattedTitle = formatTitle(title);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    setCount((c) => c + 1);
  };

  // Render
  return (
    <div>
      <h1>{formattedTitle}</h1>
      <button onClick={handleClick}>{count}</button>
    </div>
  );
}
```

## State Management

### Zustand Store Pattern

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
  // State
  count: number;
  items: string[];

  // Actions
  increment: () => void;
  addItem: (item: string) => void;
  reset: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial state
      count: 0,
      items: [],

      // Actions
      increment: () => set((state) => ({ count: state.count + 1 })),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      reset: () => set({ count: 0, items: [] }),
    }),
    {
      name: "store-name",
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);
```

### Selective Subscriptions

```typescript
// ✅ Good: Subscribe to specific state
const count = useStore((state) => state.count);

// ❌ Bad: Subscribe to entire store
const store = useStore();
```

## Styling

### Tailwind CSS

```tsx
// ✅ Good: Use Tailwind utilities
<div className="flex items-center gap-4 p-4 bg-background rounded-lg">

// ✅ Good: Use cn() for conditional classes
<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// ❌ Bad: Inline styles
<div style={{ display: "flex", padding: "16px" }}>
```

### CSS Variables

```tsx
// ✅ Good: Use semantic color names
<div className="bg-background text-foreground">

// ❌ Bad: Hard-coded colors
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
```

## Error Handling

```typescript
// ✅ Good: Proper error handling
async function loadPDF(url: string): Promise<PDFDocument | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load PDF: ${response.status}`);
    }
    return await parsePDF(response);
  } catch (error) {
    console.error("PDF loading failed:", error);
    return null;
  }
}

// ✅ Good: Error boundaries for React
<ErrorBoundary fallback={<ErrorMessage />}>
  <PDFViewer />
</ErrorBoundary>
```

## Comments

```typescript
// ✅ Good: Explain "why", not "what"
// Using requestAnimationFrame to batch DOM updates and prevent layout thrashing
requestAnimationFrame(() => {
  updatePagePositions();
});

// ❌ Bad: Obvious comments
// Increment the counter
counter++;
```

## Testing

```typescript
// ✅ Good: Descriptive test names
describe("PDFViewer", () => {
  it("navigates to the next page when clicking the next button", async () => {
    render(<PDFViewer url="/test.pdf" />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Page 2")).toBeInTheDocument();
  });
});

// ✅ Good: Test behavior, not implementation
expect(screen.getByText("Page 2")).toBeInTheDocument();

// ❌ Bad: Testing implementation details
expect(component.state.currentPage).toBe(2);
```

## Accessibility

```tsx
// ✅ Good: Semantic HTML and ARIA
<button
  aria-label="Go to next page"
  aria-disabled={isLastPage}
  onClick={nextPage}
>
  <ChevronRight />
</button>

// ✅ Good: Keyboard navigation
<div
  role="listbox"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
```

## Performance

```typescript
// ✅ Good: Memoize expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ✅ Good: Lazy load heavy components
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  loading: () => <Skeleton />,
});
```

## Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF annotation export feature
fix: resolve page navigation issue in continuous mode
docs: update installation guide
refactor: simplify zoom calculation logic
test: add unit tests for PDF store
chore: update dependencies
ci: add macOS build to workflow
```
