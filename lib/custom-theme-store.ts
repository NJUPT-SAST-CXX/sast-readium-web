import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import {
  isTauri,
  loadCustomThemes,
  saveCustomThemes,
  type CustomThemesStorage,
} from "./tauri-bridge";

/**
 * Custom theme color variables matching globals.css structure
 */
export interface CustomThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Sidebar colors
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

/**
 * Custom theme definition
 */
export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: CustomThemeColors;
  radius?: string; // e.g., "0.375rem"
  createdAt: number;
  updatedAt: number;
}

/**
 * Theme export format with version for future compatibility
 */
export interface ThemeExportData {
  version: 1;
  exportedAt: number;
  themes: CustomTheme[];
}

/**
 * Built-in theme presets
 */
export const BUILTIN_THEMES: Omit<
  CustomTheme,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Ocean Blue",
    description: "A calming blue theme inspired by the ocean",
    colors: {
      background: "oklch(0.98 0.01 230)",
      foreground: "oklch(0.25 0.02 230)",
      card: "oklch(0.97 0.01 230)",
      cardForeground: "oklch(0.25 0.02 230)",
      popover: "oklch(0.97 0.01 230)",
      popoverForeground: "oklch(0.25 0.02 230)",
      primary: "oklch(0.55 0.18 230)",
      primaryForeground: "oklch(1.0 0 0)",
      secondary: "oklch(0.92 0.02 230)",
      secondaryForeground: "oklch(0.35 0.03 230)",
      muted: "oklch(0.94 0.01 230)",
      mutedForeground: "oklch(0.50 0.02 230)",
      accent: "oklch(0.88 0.04 200)",
      accentForeground: "oklch(0.30 0.05 230)",
      destructive: "oklch(0.60 0.20 25)",
      destructiveForeground: "oklch(1.0 0 0)",
      border: "oklch(0.88 0.02 230)",
      input: "oklch(0.88 0.02 230)",
      ring: "oklch(0.55 0.18 230)",
      sidebar: "oklch(0.95 0.01 230)",
      sidebarForeground: "oklch(0.25 0.02 230)",
      sidebarPrimary: "oklch(0.55 0.18 230)",
      sidebarPrimaryForeground: "oklch(1.0 0 0)",
      sidebarAccent: "oklch(0.88 0.04 200)",
      sidebarAccentForeground: "oklch(0.30 0.05 230)",
      sidebarBorder: "oklch(0.88 0.02 230)",
      sidebarRing: "oklch(0.55 0.18 230)",
      chart1: "oklch(0.55 0.18 230)",
      chart2: "oklch(0.50 0.20 200)",
      chart3: "oklch(0.45 0.18 180)",
      chart4: "oklch(0.40 0.15 160)",
      chart5: "oklch(0.35 0.12 140)",
    },
    radius: "0.5rem",
  },
  {
    name: "Forest Green",
    description: "A natural green theme inspired by forests",
    colors: {
      background: "oklch(0.98 0.01 140)",
      foreground: "oklch(0.25 0.03 140)",
      card: "oklch(0.97 0.01 140)",
      cardForeground: "oklch(0.25 0.03 140)",
      popover: "oklch(0.97 0.01 140)",
      popoverForeground: "oklch(0.25 0.03 140)",
      primary: "oklch(0.50 0.15 145)",
      primaryForeground: "oklch(1.0 0 0)",
      secondary: "oklch(0.92 0.02 140)",
      secondaryForeground: "oklch(0.35 0.04 140)",
      muted: "oklch(0.94 0.01 140)",
      mutedForeground: "oklch(0.50 0.02 140)",
      accent: "oklch(0.85 0.05 120)",
      accentForeground: "oklch(0.30 0.06 140)",
      destructive: "oklch(0.60 0.20 25)",
      destructiveForeground: "oklch(1.0 0 0)",
      border: "oklch(0.88 0.02 140)",
      input: "oklch(0.88 0.02 140)",
      ring: "oklch(0.50 0.15 145)",
      sidebar: "oklch(0.95 0.01 140)",
      sidebarForeground: "oklch(0.25 0.03 140)",
      sidebarPrimary: "oklch(0.50 0.15 145)",
      sidebarPrimaryForeground: "oklch(1.0 0 0)",
      sidebarAccent: "oklch(0.85 0.05 120)",
      sidebarAccentForeground: "oklch(0.30 0.06 140)",
      sidebarBorder: "oklch(0.88 0.02 140)",
      sidebarRing: "oklch(0.50 0.15 145)",
      chart1: "oklch(0.50 0.15 145)",
      chart2: "oklch(0.45 0.18 130)",
      chart3: "oklch(0.40 0.15 115)",
      chart4: "oklch(0.35 0.12 100)",
      chart5: "oklch(0.30 0.10 85)",
    },
    radius: "0.375rem",
  },
  {
    name: "Rose Pink",
    description: "A warm pink theme with soft tones",
    colors: {
      background: "oklch(0.98 0.01 350)",
      foreground: "oklch(0.25 0.03 350)",
      card: "oklch(0.97 0.02 350)",
      cardForeground: "oklch(0.25 0.03 350)",
      popover: "oklch(0.97 0.02 350)",
      popoverForeground: "oklch(0.25 0.03 350)",
      primary: "oklch(0.60 0.18 350)",
      primaryForeground: "oklch(1.0 0 0)",
      secondary: "oklch(0.92 0.03 350)",
      secondaryForeground: "oklch(0.35 0.04 350)",
      muted: "oklch(0.94 0.02 350)",
      mutedForeground: "oklch(0.50 0.03 350)",
      accent: "oklch(0.88 0.06 330)",
      accentForeground: "oklch(0.30 0.06 350)",
      destructive: "oklch(0.60 0.20 25)",
      destructiveForeground: "oklch(1.0 0 0)",
      border: "oklch(0.88 0.03 350)",
      input: "oklch(0.88 0.03 350)",
      ring: "oklch(0.60 0.18 350)",
      sidebar: "oklch(0.95 0.02 350)",
      sidebarForeground: "oklch(0.25 0.03 350)",
      sidebarPrimary: "oklch(0.60 0.18 350)",
      sidebarPrimaryForeground: "oklch(1.0 0 0)",
      sidebarAccent: "oklch(0.88 0.06 330)",
      sidebarAccentForeground: "oklch(0.30 0.06 350)",
      sidebarBorder: "oklch(0.88 0.03 350)",
      sidebarRing: "oklch(0.60 0.18 350)",
      chart1: "oklch(0.60 0.18 350)",
      chart2: "oklch(0.55 0.20 330)",
      chart3: "oklch(0.50 0.18 310)",
      chart4: "oklch(0.45 0.15 290)",
      chart5: "oklch(0.40 0.12 270)",
    },
    radius: "0.625rem",
  },
  {
    name: "Midnight Purple",
    description: "A dark purple theme for night owls",
    colors: {
      background: "oklch(0.18 0.02 280)",
      foreground: "oklch(0.92 0.01 280)",
      card: "oklch(0.22 0.02 280)",
      cardForeground: "oklch(0.92 0.01 280)",
      popover: "oklch(0.22 0.02 280)",
      popoverForeground: "oklch(0.92 0.01 280)",
      primary: "oklch(0.65 0.20 280)",
      primaryForeground: "oklch(1.0 0 0)",
      secondary: "oklch(0.28 0.03 280)",
      secondaryForeground: "oklch(0.88 0.01 280)",
      muted: "oklch(0.25 0.02 280)",
      mutedForeground: "oklch(0.70 0.01 280)",
      accent: "oklch(0.45 0.15 300)",
      accentForeground: "oklch(0.90 0.02 280)",
      destructive: "oklch(0.60 0.20 25)",
      destructiveForeground: "oklch(1.0 0 0)",
      border: "oklch(0.35 0.03 280)",
      input: "oklch(0.35 0.03 280)",
      ring: "oklch(0.65 0.20 280)",
      sidebar: "oklch(0.16 0.02 280)",
      sidebarForeground: "oklch(0.92 0.01 280)",
      sidebarPrimary: "oklch(0.65 0.20 280)",
      sidebarPrimaryForeground: "oklch(1.0 0 0)",
      sidebarAccent: "oklch(0.45 0.15 300)",
      sidebarAccentForeground: "oklch(0.90 0.02 280)",
      sidebarBorder: "oklch(0.35 0.03 280)",
      sidebarRing: "oklch(0.65 0.20 280)",
      chart1: "oklch(0.65 0.20 280)",
      chart2: "oklch(0.60 0.22 300)",
      chart3: "oklch(0.55 0.20 320)",
      chart4: "oklch(0.50 0.18 340)",
      chart5: "oklch(0.45 0.15 360)",
    },
    radius: "0.5rem",
  },
  {
    name: "Sunset Orange",
    description: "A warm orange theme inspired by sunsets",
    colors: {
      background: "oklch(0.98 0.01 50)",
      foreground: "oklch(0.25 0.04 40)",
      card: "oklch(0.97 0.02 50)",
      cardForeground: "oklch(0.25 0.04 40)",
      popover: "oklch(0.97 0.02 50)",
      popoverForeground: "oklch(0.25 0.04 40)",
      primary: "oklch(0.65 0.20 45)",
      primaryForeground: "oklch(1.0 0 0)",
      secondary: "oklch(0.92 0.03 50)",
      secondaryForeground: "oklch(0.35 0.05 40)",
      muted: "oklch(0.94 0.02 50)",
      mutedForeground: "oklch(0.50 0.03 40)",
      accent: "oklch(0.85 0.08 30)",
      accentForeground: "oklch(0.30 0.06 40)",
      destructive: "oklch(0.55 0.22 20)",
      destructiveForeground: "oklch(1.0 0 0)",
      border: "oklch(0.88 0.03 50)",
      input: "oklch(0.88 0.03 50)",
      ring: "oklch(0.65 0.20 45)",
      sidebar: "oklch(0.95 0.02 50)",
      sidebarForeground: "oklch(0.25 0.04 40)",
      sidebarPrimary: "oklch(0.65 0.20 45)",
      sidebarPrimaryForeground: "oklch(1.0 0 0)",
      sidebarAccent: "oklch(0.85 0.08 30)",
      sidebarAccentForeground: "oklch(0.30 0.06 40)",
      sidebarBorder: "oklch(0.88 0.03 50)",
      sidebarRing: "oklch(0.65 0.20 45)",
      chart1: "oklch(0.65 0.20 45)",
      chart2: "oklch(0.60 0.22 35)",
      chart3: "oklch(0.55 0.20 25)",
      chart4: "oklch(0.50 0.18 15)",
      chart5: "oklch(0.45 0.15 5)",
    },
    radius: "0.375rem",
  },
];

/**
 * Default theme colors (matching light mode in globals.css)
 */
export const DEFAULT_THEME_COLORS: CustomThemeColors = {
  background: "oklch(1.0 0 0)",
  foreground: "oklch(0.32 0 0)",
  card: "oklch(1.0 0 0)",
  cardForeground: "oklch(0.32 0 0)",
  popover: "oklch(1.0 0 0)",
  popoverForeground: "oklch(0.32 0 0)",
  primary: "oklch(0.62 0.19 260)",
  primaryForeground: "oklch(1.0 0 0)",
  secondary: "oklch(0.97 0.003 265)",
  secondaryForeground: "oklch(0.45 0.03 257)",
  muted: "oklch(0.98 0.002 248)",
  mutedForeground: "oklch(0.55 0.02 264)",
  accent: "oklch(0.95 0.025 237)",
  accentForeground: "oklch(0.38 0.14 266)",
  destructive: "oklch(0.64 0.21 25)",
  destructiveForeground: "oklch(1.0 0 0)",
  border: "oklch(0.93 0.006 265)",
  input: "oklch(0.93 0.006 265)",
  ring: "oklch(0.62 0.19 260)",
  sidebar: "oklch(0.98 0.002 248)",
  sidebarForeground: "oklch(0.32 0 0)",
  sidebarPrimary: "oklch(0.62 0.19 260)",
  sidebarPrimaryForeground: "oklch(1.0 0 0)",
  sidebarAccent: "oklch(0.95 0.025 237)",
  sidebarAccentForeground: "oklch(0.38 0.14 266)",
  sidebarBorder: "oklch(0.93 0.006 265)",
  sidebarRing: "oklch(0.62 0.19 260)",
  chart1: "oklch(0.62 0.19 260)",
  chart2: "oklch(0.55 0.22 263)",
  chart3: "oklch(0.49 0.22 264)",
  chart4: "oklch(0.42 0.18 266)",
  chart5: "oklch(0.38 0.14 266)",
};

interface CustomThemeState {
  // Custom themes list
  customThemes: CustomTheme[];
  // Currently active custom theme ID (null = use built-in theme mode)
  activeCustomThemeId: string | null;

  // Actions
  addTheme: (
    theme: Omit<CustomTheme, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateTheme: (
    id: string,
    updates: Partial<Omit<CustomTheme, "id" | "createdAt">>
  ) => void;
  deleteTheme: (id: string) => void;
  duplicateTheme: (id: string) => string | null;
  setActiveCustomTheme: (id: string | null) => void;
  getThemeById: (id: string) => CustomTheme | undefined;

  // Import/Export
  exportThemes: (themeIds?: string[]) => ThemeExportData;
  exportThemesToJson: (themeIds?: string[]) => string;
  importThemes: (data: ThemeExportData | string) => {
    success: boolean;
    imported: number;
    errors: string[];
  };

  // Preset themes
  addPresetTheme: (presetIndex: number) => string | null;
}

export const useCustomThemeStore = create<CustomThemeState>()(
  persist(
    (set, get) => ({
      customThemes: [],
      activeCustomThemeId: null,

      addTheme: (theme) => {
        const id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const now = Date.now();
        const newTheme: CustomTheme = {
          ...theme,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          customThemes: [...state.customThemes, newTheme],
        }));
        return id;
      },

      updateTheme: (id, updates) => {
        set((state) => ({
          customThemes: state.customThemes.map((theme) =>
            theme.id === id
              ? { ...theme, ...updates, updatedAt: Date.now() }
              : theme
          ),
        }));
      },

      deleteTheme: (id) => {
        set((state) => ({
          customThemes: state.customThemes.filter((theme) => theme.id !== id),
          activeCustomThemeId:
            state.activeCustomThemeId === id ? null : state.activeCustomThemeId,
        }));
      },

      duplicateTheme: (id) => {
        const theme = get().customThemes.find((t) => t.id === id);
        if (!theme) return null;

        const newId = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const now = Date.now();
        const duplicatedTheme: CustomTheme = {
          ...theme,
          id: newId,
          name: `${theme.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          customThemes: [...state.customThemes, duplicatedTheme],
        }));
        return newId;
      },

      setActiveCustomTheme: (id) => {
        set({ activeCustomThemeId: id });
      },

      getThemeById: (id) => {
        return get().customThemes.find((t) => t.id === id);
      },

      exportThemes: (themeIds) => {
        const themes = themeIds
          ? get().customThemes.filter((t) => themeIds.includes(t.id))
          : get().customThemes;

        return {
          version: 1,
          exportedAt: Date.now(),
          themes,
        };
      },

      exportThemesToJson: (themeIds) => {
        const data = get().exportThemes(themeIds);
        return JSON.stringify(data, null, 2);
      },

      importThemes: (data) => {
        const errors: string[] = [];
        let parsed: ThemeExportData;

        // Parse if string
        if (typeof data === "string") {
          try {
            parsed = JSON.parse(data);
          } catch {
            return {
              success: false,
              imported: 0,
              errors: ["Invalid JSON format"],
            };
          }
        } else {
          parsed = data;
        }

        // Validate version
        if (parsed.version !== 1) {
          return {
            success: false,
            imported: 0,
            errors: [`Unsupported theme version: ${parsed.version}`],
          };
        }

        // Validate themes array
        if (!Array.isArray(parsed.themes)) {
          return {
            success: false,
            imported: 0,
            errors: ["Invalid themes data"],
          };
        }

        const validThemes: CustomTheme[] = [];
        const existingNames = new Set(get().customThemes.map((t) => t.name));

        for (const theme of parsed.themes) {
          // Basic validation
          if (!theme.name || !theme.colors) {
            errors.push(`Skipped invalid theme: missing name or colors`);
            continue;
          }

          // Generate new ID to avoid conflicts
          const newId = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const now = Date.now();

          // Handle duplicate names
          let name = theme.name;
          let counter = 1;
          while (existingNames.has(name)) {
            name = `${theme.name} (${counter})`;
            counter++;
          }
          existingNames.add(name);

          validThemes.push({
            ...theme,
            id: newId,
            name,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (validThemes.length > 0) {
          set((state) => ({
            customThemes: [...state.customThemes, ...validThemes],
          }));
        }

        return {
          success: validThemes.length > 0,
          imported: validThemes.length,
          errors,
        };
      },

      addPresetTheme: (presetIndex) => {
        const preset = BUILTIN_THEMES[presetIndex];
        if (!preset) return null;

        return get().addTheme(preset);
      },
    }),
    {
      name: "custom-themes-storage",
      partialize: (state) => ({
        customThemes: state.customThemes,
        activeCustomThemeId: state.activeCustomThemeId,
      }),
    }
  ) as StateCreator<CustomThemeState, [], []>
);

/**
 * Convert CustomThemeColors to CSS variable assignments
 */
export function themeColorsToCssVars(
  colors: CustomThemeColors
): Record<string, string> {
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--card": colors.card,
    "--card-foreground": colors.cardForeground,
    "--popover": colors.popover,
    "--popover-foreground": colors.popoverForeground,
    "--primary": colors.primary,
    "--primary-foreground": colors.primaryForeground,
    "--secondary": colors.secondary,
    "--secondary-foreground": colors.secondaryForeground,
    "--muted": colors.muted,
    "--muted-foreground": colors.mutedForeground,
    "--accent": colors.accent,
    "--accent-foreground": colors.accentForeground,
    "--destructive": colors.destructive,
    "--destructive-foreground": colors.destructiveForeground,
    "--border": colors.border,
    "--input": colors.input,
    "--ring": colors.ring,
    "--sidebar": colors.sidebar,
    "--sidebar-foreground": colors.sidebarForeground,
    "--sidebar-primary": colors.sidebarPrimary,
    "--sidebar-primary-foreground": colors.sidebarPrimaryForeground,
    "--sidebar-accent": colors.sidebarAccent,
    "--sidebar-accent-foreground": colors.sidebarAccentForeground,
    "--sidebar-border": colors.sidebarBorder,
    "--sidebar-ring": colors.sidebarRing,
    "--chart-1": colors.chart1,
    "--chart-2": colors.chart2,
    "--chart-3": colors.chart3,
    "--chart-4": colors.chart4,
    "--chart-5": colors.chart5,
  };
}

/**
 * Apply custom theme CSS variables to document root
 */
export function applyCustomTheme(theme: CustomTheme | null): void {
  const root = document.documentElement;

  if (!theme) {
    // Remove custom theme class and inline styles
    root.classList.remove("custom-theme");
    root.style.removeProperty("--radius");
    // Remove all custom color variables
    const vars = themeColorsToCssVars(DEFAULT_THEME_COLORS);
    for (const key of Object.keys(vars)) {
      root.style.removeProperty(key);
    }
    return;
  }

  // Add custom theme class
  root.classList.add("custom-theme");

  // Apply color variables
  const vars = themeColorsToCssVars(theme.colors);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Apply radius if specified
  if (theme.radius) {
    root.style.setProperty("--radius", theme.radius);
  }
}

/**
 * Convert CustomTheme to CustomThemesStorage format for Tauri persistence
 */
function themesToStorage(themes: CustomTheme[]): CustomThemesStorage {
  return {
    version: 1,
    themes: themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      colors: theme.colors as unknown as Record<string, string>,
      radius: theme.radius,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    })),
  };
}

/**
 * Convert CustomThemesStorage to CustomTheme[] format
 */
function storageToThemes(storage: CustomThemesStorage): CustomTheme[] {
  return storage.themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    colors: theme.colors as unknown as CustomThemeColors,
    radius: theme.radius,
    createdAt: theme.createdAt,
    updatedAt: theme.updatedAt,
  }));
}

/**
 * Load custom themes from Tauri desktop storage
 * Call this on app initialization in Tauri environment
 */
export async function loadCustomThemesFromDesktop(): Promise<void> {
  if (!isTauri()) return;

  try {
    const storage = await loadCustomThemes();
    if (storage && storage.themes.length > 0) {
      const themes = storageToThemes(storage);
      useCustomThemeStore.setState({ customThemes: themes });
    }
  } catch (error) {
    console.error("Failed to load custom themes from desktop storage", error);
  }
}

/**
 * Save custom themes to Tauri desktop storage
 * Call this when themes are modified in Tauri environment
 */
export async function saveCustomThemesToDesktop(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { customThemes } = useCustomThemeStore.getState();
    const storage = themesToStorage(customThemes);
    await saveCustomThemes(storage);
  } catch (error) {
    console.error("Failed to save custom themes to desktop storage", error);
  }
}

/**
 * Subscribe to store changes and auto-save to desktop storage
 */
export function setupDesktopThemeSync(): () => void {
  if (!isTauri()) return () => {};

  // Debounce save to avoid too many writes
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = useCustomThemeStore.subscribe((state, prevState) => {
    // Only save if themes have changed
    if (state.customThemes !== prevState.customThemes) {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(() => {
        saveCustomThemesToDesktop();
      }, 500);
    }
  });

  return () => {
    unsubscribe();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  };
}
