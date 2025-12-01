# Testing Guide

This guide covers the testing setup, patterns, and best practices for SAST Readium.

## Testing Stack

| Tool                      | Purpose                        |
| ------------------------- | ------------------------------ |
| **Jest 30.x**             | Test runner                    |
| **React Testing Library** | Component testing              |
| **jsdom**                 | Browser environment simulation |
| **V8**                    | Coverage provider              |

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific file
pnpm test path/to/file.test.tsx

# Run matching pattern
pnpm test --testNamePattern="Button"
```

### Watch Mode Options

In watch mode, press:

- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Filter by filename
- `t` - Filter by test name
- `q` - Quit

## Test File Structure

### Location

Tests are co-located with source files:

```text
components/
├── ui/
│   ├── button.tsx
│   └── button.test.tsx      # Co-located test
├── pdf-viewer/
│   ├── pdf-viewer.tsx
│   └── __tests__/           # Test directory
│       └── pdf-viewer.test.tsx
```

### Naming Convention

- `*.test.ts` - TypeScript tests
- `*.test.tsx` - React component tests
- `*.spec.ts` - Alternative naming (also supported)

## Writing Tests

### Component Tests

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);

    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Hook Tests

```tsx
import { renderHook, act } from "@testing-library/react";
import { usePDFNavigation } from "./use-pdf-navigation";

describe("usePDFNavigation", () => {
  beforeEach(() => {
    // Reset store state
    usePDFStore.setState({ currentPage: 1, numPages: 10 });
  });

  it("navigates to next page", () => {
    const { result } = renderHook(() => usePDFNavigation());

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it("does not go past last page", () => {
    usePDFStore.setState({ currentPage: 10, numPages: 10 });
    const { result } = renderHook(() => usePDFNavigation());

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(10);
  });
});
```

### Utility Tests

```typescript
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges Tailwind classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

### Async Tests

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { PDFViewer } from "./pdf-viewer";

describe("PDFViewer", () => {
  it("loads PDF and displays first page", async () => {
    render(<PDFViewer url="/test.pdf" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 10")).toBeInTheDocument();
  });
});
```

## Mocking

### Mocking Modules

```typescript
// Mock entire module
jest.mock("@/lib/pdf-utils", () => ({
  loadPDF: jest.fn().mockResolvedValue({ numPages: 10 }),
  extractText: jest.fn().mockResolvedValue("Sample text"),
}));

// Mock specific function
import { loadPDF } from "@/lib/pdf-utils";
jest.mocked(loadPDF).mockResolvedValue({ numPages: 5 });
```

### Mocking Next.js

Already configured in `jest.setup.ts`:

```typescript
// next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImageProps) => <img {...props} />,
}));

// next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking Zustand Stores

```typescript
import { usePDFStore } from "@/lib/pdf-store";

beforeEach(() => {
  usePDFStore.setState({
    currentPage: 1,
    numPages: 10,
    zoom: 1,
    annotations: [],
  });
});

afterEach(() => {
  usePDFStore.getState().reset?.();
});
```

### Mocking Tauri

```typescript
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("@tauri-apps/plugin-dialog", () => ({
  open: jest.fn(),
  save: jest.fn(),
}));
```

## Testing Patterns

### Testing User Interactions

```tsx
import userEvent from "@testing-library/user-event";

it("handles form submission", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: "test@example.com",
    password: "password123",
  });
});
```

### Testing Accessibility

```tsx
it("has accessible button", () => {
  render(<IconButton icon={<SearchIcon />} label="Search" />);

  const button = screen.getByRole("button", { name: /search/i });
  expect(button).toBeInTheDocument();
  expect(button).toHaveAccessibleName("Search");
});
```

### Testing Error States

```tsx
it("displays error message on failure", async () => {
  jest.mocked(loadPDF).mockRejectedValue(new Error("Failed to load"));

  render(<PDFViewer url="/invalid.pdf" />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

## Coverage

### Thresholds

Configured in `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 70,
    statements: 70,
  },
},
```

### Viewing Reports

```bash
# Generate coverage
pnpm test:coverage

# Open HTML report
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

### Coverage Targets

Focus coverage on:

- `lib/` - Utility functions and services
- `hooks/` - Custom React hooks
- Complex UI logic in components

## Best Practices

### 1. Test Behavior, Not Implementation

```tsx
// ✅ Good: Test what user sees
expect(screen.getByText("Page 2")).toBeInTheDocument();

// ❌ Bad: Test internal state
expect(component.state.currentPage).toBe(2);
```

### 2. Use Accessible Queries

Priority order:

1. `getByRole` - Best for most elements
2. `getByLabelText` - Form fields
3. `getByPlaceholderText` - Inputs without labels
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

### 3. Use userEvent Over fireEvent

```tsx
// ✅ Good: Simulates real user behavior
const user = userEvent.setup();
await user.click(button);

// ❌ Bad: Synthetic event
fireEvent.click(button);
```

### 4. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // Usually automatic
});
```

### 5. Avoid Test Interdependence

Each test should be independent and not rely on state from other tests.

## Debugging Tests

### Verbose Output

```bash
pnpm test --verbose
```

### Debug Mode

```tsx
import { screen } from "@testing-library/react";

// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole("button"));
```

### Increase Timeout

```typescript
it("handles slow operation", async () => {
  // Increase timeout for this test
}, 10000);
```

## CI Integration

Tests run automatically in GitHub Actions:

1. On push to `main` or `develop`
2. On pull requests
3. Coverage uploaded to Codecov

### CI Configuration

```yaml
- name: Run tests
  run: pnpm test --ci --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```
