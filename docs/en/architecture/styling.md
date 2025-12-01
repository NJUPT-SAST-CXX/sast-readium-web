# Styling & Theming

SAST Readium uses Tailwind CSS v4 with CSS custom properties for a flexible, themeable design system.

## CSS Architecture

### Technology Stack

| Tool                      | Purpose                     |
| ------------------------- | --------------------------- |
| **Tailwind CSS v4**       | Utility-first CSS framework |
| **PostCSS**               | CSS processing              |
| **CSS Custom Properties** | Theme variables             |
| **shadcn/ui**             | Component styling patterns  |

### File Structure

```text
app/
└── globals.css         # Global styles, CSS variables, Tailwind imports

components/
└── ui/                 # shadcn/ui components with Tailwind classes
```

## Tailwind Configuration

Tailwind v4 uses CSS-based configuration in `globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

## CSS Custom Properties

### Theme Variables

All theme colors are defined as CSS custom properties in `globals.css`:

```css
:root {
  /* Background colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Card colors */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  /* Primary colors */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;

  /* Secondary colors */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Accent colors */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  /* Destructive colors */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  /* Border and input */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;

  /* Border radius */
  --radius: 0.5rem;
}
```

### Dark Theme

Dark mode variables override the defaults:

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### Sepia Theme

Reading-friendly warm tones:

```css
.sepia {
  --background: 39 50% 96%;
  --foreground: 30 20% 20%;

  --card: 39 40% 94%;
  --card-foreground: 30 20% 20%;

  --primary: 30 60% 40%;
  --primary-foreground: 39 50% 96%;
}
```

## Theme Switching

### Theme Provider

The app uses `next-themes` for theme management:

```typescript
// components/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Using Theme

```typescript
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

## Custom Themes

Users can create custom color themes via the Custom Theme Store.

### Theme Structure

```typescript
interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    // ... 35+ color variables
  };
  radius: number;
}
```

### Applying Custom Themes

```typescript
function applyCustomTheme(theme: CustomTheme) {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });

  root.style.setProperty("--radius", `${theme.radius}rem`);
}
```

### Built-in Presets

The app includes preset themes:

- **Ocean Blue**: Cool blue tones
- **Forest Green**: Natural green palette
- **Rose Pink**: Warm pink accents
- **Midnight Purple**: Deep purple theme
- **Sunset Orange**: Warm orange tones

## Component Styling

### shadcn/ui Pattern

Components use the `cn()` utility for conditional classes:

```typescript
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}

function Button({ variant = "default", size = "default", className }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",

        // Variant styles
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        variant === "outline" && "border border-input bg-background hover:bg-accent",

        // Size styles
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-9 px-3",
        size === "lg" && "h-11 px-8",

        // Custom classes
        className
      )}
    />
  );
}
```

### The `cn()` Utility

Combines `clsx` and `tailwind-merge`:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Responsive Design

### Breakpoints

Tailwind's default breakpoints:

| Breakpoint | Min Width | CSS                          |
| ---------- | --------- | ---------------------------- |
| `sm`       | 640px     | `@media (min-width: 640px)`  |
| `md`       | 768px     | `@media (min-width: 768px)`  |
| `lg`       | 1024px    | `@media (min-width: 1024px)` |
| `xl`       | 1280px    | `@media (min-width: 1280px)` |
| `2xl`      | 1536px    | `@media (min-width: 1536px)` |

### Mobile-First Approach

```tsx
<div
  className="
  flex flex-col          /* Mobile: stack vertically */
  md:flex-row            /* Tablet+: side by side */
  gap-4
"
>
  <aside
    className="
    w-full               /* Mobile: full width */
    md:w-64              /* Tablet+: fixed width */
  "
  >
    Sidebar
  </aside>
  <main className="flex-1">Content</main>
</div>
```

## Animation

### Tailwind Animations

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Motion Library

For complex animations, use the `motion` library:

```tsx
import { motion } from "motion/react";

function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

## Best Practices

### 1. Use Semantic Color Names

```tsx
// ✅ Good: Semantic names
<button className="bg-primary text-primary-foreground">
  Submit
</button>

// ❌ Bad: Hard-coded colors
<button className="bg-blue-500 text-white">
  Submit
</button>
```

### 2. Leverage CSS Variables

```tsx
// ✅ Good: Uses theme variable
<div className="bg-background text-foreground">

// ❌ Bad: Hard-coded values
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
```

### 3. Component Composition

```tsx
// ✅ Good: Compose with className
<Button className="w-full mt-4" variant="outline">
  Cancel
</Button>

// ❌ Bad: Override with inline styles
<Button style={{ width: "100%", marginTop: "1rem" }}>
  Cancel
</Button>
```
