import {
  useCustomThemeStore,
  CustomTheme,
  CustomThemeColors,
  DEFAULT_THEME_COLORS,
  BUILTIN_THEMES,
  themeColorsToCssVars,
  applyCustomTheme,
  ThemeExportData,
} from "./custom-theme-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("custom-theme-store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useCustomThemeStore.setState({
      customThemes: [],
      activeCustomThemeId: null,
    });
    localStorageMock.clear();
  });

  describe("DEFAULT_THEME_COLORS", () => {
    it("should have all required color properties", () => {
      const requiredKeys: (keyof CustomThemeColors)[] = [
        "background",
        "foreground",
        "card",
        "cardForeground",
        "popover",
        "popoverForeground",
        "primary",
        "primaryForeground",
        "secondary",
        "secondaryForeground",
        "muted",
        "mutedForeground",
        "accent",
        "accentForeground",
        "destructive",
        "destructiveForeground",
        "border",
        "input",
        "ring",
        "sidebar",
        "sidebarForeground",
        "sidebarPrimary",
        "sidebarPrimaryForeground",
        "sidebarAccent",
        "sidebarAccentForeground",
        "sidebarBorder",
        "sidebarRing",
        "chart1",
        "chart2",
        "chart3",
        "chart4",
        "chart5",
      ];

      requiredKeys.forEach((key) => {
        expect(DEFAULT_THEME_COLORS[key]).toBeDefined();
        expect(typeof DEFAULT_THEME_COLORS[key]).toBe("string");
      });
    });
  });

  describe("BUILTIN_THEMES", () => {
    it("should have at least one preset theme", () => {
      expect(BUILTIN_THEMES.length).toBeGreaterThan(0);
    });

    it("should have valid structure for each preset", () => {
      BUILTIN_THEMES.forEach((preset) => {
        expect(preset.name).toBeDefined();
        expect(typeof preset.name).toBe("string");
        expect(preset.colors).toBeDefined();
        expect(preset.colors.primary).toBeDefined();
        expect(preset.colors.background).toBeDefined();
      });
    });

    it("should include Ocean Blue preset", () => {
      const oceanBlue = BUILTIN_THEMES.find((t) => t.name === "Ocean Blue");
      expect(oceanBlue).toBeDefined();
    });
  });

  describe("addTheme", () => {
    it("should add a new theme and return its id", () => {
      const { addTheme } = useCustomThemeStore.getState();

      const themeData = {
        name: "Test Theme",
        description: "A test theme",
        colors: DEFAULT_THEME_COLORS,
        radius: "0.5rem",
      };

      const id = addTheme(themeData);

      expect(id).toBeDefined();
      expect(id).toMatch(/^theme-/);

      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(1);
      expect(customThemes[0].name).toBe("Test Theme");
      expect(customThemes[0].description).toBe("A test theme");
      expect(customThemes[0].id).toBe(id);
    });

    it("should set createdAt and updatedAt timestamps", () => {
      const { addTheme } = useCustomThemeStore.getState();
      const before = Date.now();

      addTheme({
        name: "Timestamp Test",
        colors: DEFAULT_THEME_COLORS,
      });

      const after = Date.now();
      const { customThemes } = useCustomThemeStore.getState();
      const theme = customThemes[0];

      expect(theme.createdAt).toBeGreaterThanOrEqual(before);
      expect(theme.createdAt).toBeLessThanOrEqual(after);
      expect(theme.updatedAt).toBe(theme.createdAt);
    });
  });

  describe("updateTheme", () => {
    it("should update an existing theme", () => {
      const { addTheme, updateTheme } = useCustomThemeStore.getState();

      const id = addTheme({
        name: "Original Name",
        colors: DEFAULT_THEME_COLORS,
      });

      updateTheme(id, { name: "Updated Name", description: "New description" });

      const { customThemes } = useCustomThemeStore.getState();
      const theme = customThemes.find((t) => t.id === id);

      expect(theme?.name).toBe("Updated Name");
      expect(theme?.description).toBe("New description");
    });

    it("should update the updatedAt timestamp", async () => {
      const { addTheme, updateTheme } = useCustomThemeStore.getState();

      const id = addTheme({
        name: "Test",
        colors: DEFAULT_THEME_COLORS,
      });

      const { customThemes: before } = useCustomThemeStore.getState();
      const originalUpdatedAt = before[0].updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      updateTheme(id, { name: "Updated" });

      const { customThemes: after } = useCustomThemeStore.getState();
      expect(after[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it("should not affect other themes", () => {
      const { addTheme, updateTheme } = useCustomThemeStore.getState();

      const id1 = addTheme({ name: "Theme 1", colors: DEFAULT_THEME_COLORS });
      const id2 = addTheme({ name: "Theme 2", colors: DEFAULT_THEME_COLORS });

      updateTheme(id1, { name: "Updated Theme 1" });

      const { customThemes } = useCustomThemeStore.getState();
      const theme2 = customThemes.find((t) => t.id === id2);

      expect(theme2?.name).toBe("Theme 2");
    });
  });

  describe("deleteTheme", () => {
    it("should remove a theme by id", () => {
      const { addTheme, deleteTheme } = useCustomThemeStore.getState();

      const id = addTheme({ name: "To Delete", colors: DEFAULT_THEME_COLORS });
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(1);

      deleteTheme(id);
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(0);
    });

    it("should clear activeCustomThemeId if deleting active theme", () => {
      const { addTheme, deleteTheme, setActiveCustomTheme } =
        useCustomThemeStore.getState();

      const id = addTheme({
        name: "Active Theme",
        colors: DEFAULT_THEME_COLORS,
      });
      setActiveCustomTheme(id);

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBe(id);

      deleteTheme(id);

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBeNull();
    });

    it("should not affect activeCustomThemeId if deleting non-active theme", () => {
      const { addTheme, deleteTheme, setActiveCustomTheme } =
        useCustomThemeStore.getState();

      const id1 = addTheme({ name: "Theme 1", colors: DEFAULT_THEME_COLORS });
      const id2 = addTheme({ name: "Theme 2", colors: DEFAULT_THEME_COLORS });

      setActiveCustomTheme(id1);
      deleteTheme(id2);

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBe(id1);
    });
  });

  describe("duplicateTheme", () => {
    it("should create a copy of an existing theme", () => {
      const { addTheme, duplicateTheme } = useCustomThemeStore.getState();

      const originalId = addTheme({
        name: "Original",
        description: "Original description",
        colors: DEFAULT_THEME_COLORS,
        radius: "0.5rem",
      });

      const newId = duplicateTheme(originalId);

      expect(newId).toBeDefined();
      expect(newId).not.toBe(originalId);

      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(2);

      const duplicate = customThemes.find((t) => t.id === newId);
      expect(duplicate?.name).toBe("Original (Copy)");
      expect(duplicate?.description).toBe("Original description");
      expect(duplicate?.radius).toBe("0.5rem");
    });

    it("should return null for non-existent theme", () => {
      const { duplicateTheme } = useCustomThemeStore.getState();
      const result = duplicateTheme("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("setActiveCustomTheme", () => {
    it("should set the active theme id", () => {
      const { addTheme, setActiveCustomTheme } = useCustomThemeStore.getState();

      const id = addTheme({ name: "Test", colors: DEFAULT_THEME_COLORS });
      setActiveCustomTheme(id);

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBe(id);
    });

    it("should allow setting to null", () => {
      const { addTheme, setActiveCustomTheme } = useCustomThemeStore.getState();

      const id = addTheme({ name: "Test", colors: DEFAULT_THEME_COLORS });
      setActiveCustomTheme(id);
      setActiveCustomTheme(null);

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBeNull();
    });
  });

  describe("getThemeById", () => {
    it("should return the theme with matching id", () => {
      const { addTheme, getThemeById } = useCustomThemeStore.getState();

      const id = addTheme({ name: "Find Me", colors: DEFAULT_THEME_COLORS });
      const theme = getThemeById(id);

      expect(theme).toBeDefined();
      expect(theme?.name).toBe("Find Me");
    });

    it("should return undefined for non-existent id", () => {
      const { getThemeById } = useCustomThemeStore.getState();
      const theme = getThemeById("non-existent");
      expect(theme).toBeUndefined();
    });
  });

  describe("exportThemes", () => {
    it("should export all themes when no ids provided", () => {
      const { addTheme, exportThemes } = useCustomThemeStore.getState();

      addTheme({ name: "Theme 1", colors: DEFAULT_THEME_COLORS });
      addTheme({ name: "Theme 2", colors: DEFAULT_THEME_COLORS });

      const exported = exportThemes();

      expect(exported.version).toBe(1);
      expect(exported.exportedAt).toBeDefined();
      expect(exported.themes).toHaveLength(2);
    });

    it("should export only specified themes when ids provided", () => {
      const { addTheme, exportThemes } = useCustomThemeStore.getState();

      const id1 = addTheme({ name: "Theme 1", colors: DEFAULT_THEME_COLORS });
      addTheme({ name: "Theme 2", colors: DEFAULT_THEME_COLORS });

      const exported = exportThemes([id1]);

      expect(exported.themes).toHaveLength(1);
      expect(exported.themes[0].name).toBe("Theme 1");
    });
  });

  describe("exportThemesToJson", () => {
    it("should return valid JSON string", () => {
      const { addTheme, exportThemesToJson } = useCustomThemeStore.getState();

      addTheme({ name: "Test", colors: DEFAULT_THEME_COLORS });

      const json = exportThemesToJson();
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(1);
      expect(parsed.themes).toHaveLength(1);
    });
  });

  describe("importThemes", () => {
    it("should import themes from valid export data", () => {
      const { importThemes } = useCustomThemeStore.getState();

      const exportData: ThemeExportData = {
        version: 1,
        exportedAt: Date.now(),
        themes: [
          {
            id: "old-id",
            name: "Imported Theme",
            colors: DEFAULT_THEME_COLORS,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      const result = importThemes(exportData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);

      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(1);
      expect(customThemes[0].name).toBe("Imported Theme");
      // Should have new id, not the old one
      expect(customThemes[0].id).not.toBe("old-id");
    });

    it("should import from JSON string", () => {
      const { importThemes } = useCustomThemeStore.getState();

      const json = JSON.stringify({
        version: 1,
        exportedAt: Date.now(),
        themes: [
          {
            id: "test",
            name: "JSON Theme",
            colors: DEFAULT_THEME_COLORS,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });

      const result = importThemes(json);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it("should handle invalid JSON", () => {
      const { importThemes } = useCustomThemeStore.getState();

      const result = importThemes("not valid json");

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain("Invalid JSON format");
    });

    it("should reject unsupported version", () => {
      const { importThemes } = useCustomThemeStore.getState();

      const result = importThemes({
        version: 999 as 1,
        exportedAt: Date.now(),
        themes: [],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain("Unsupported theme version");
    });

    it("should handle duplicate names by appending number", () => {
      const { addTheme, importThemes } = useCustomThemeStore.getState();

      addTheme({ name: "Existing Theme", colors: DEFAULT_THEME_COLORS });

      const result = importThemes({
        version: 1,
        exportedAt: Date.now(),
        themes: [
          {
            id: "test",
            name: "Existing Theme",
            colors: DEFAULT_THEME_COLORS,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });

      expect(result.success).toBe(true);

      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(2);
      expect(customThemes[1].name).toBe("Existing Theme (1)");
    });

    it("should skip themes without name or colors", () => {
      const { importThemes } = useCustomThemeStore.getState();

      const result = importThemes({
        version: 1,
        exportedAt: Date.now(),
        themes: [
          {
            id: "1",
            name: "",
            colors: DEFAULT_THEME_COLORS,
            createdAt: 0,
            updatedAt: 0,
          } as CustomTheme,
          {
            id: "2",
            name: "Valid",
            colors: DEFAULT_THEME_COLORS,
            createdAt: 0,
            updatedAt: 0,
          },
        ],
      });

      expect(result.imported).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("addPresetTheme", () => {
    it("should add a preset theme by index", () => {
      const { addPresetTheme } = useCustomThemeStore.getState();

      const id = addPresetTheme(0);

      expect(id).toBeDefined();

      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(1);
      expect(customThemes[0].name).toBe(BUILTIN_THEMES[0].name);
    });

    it("should return null for invalid index", () => {
      const { addPresetTheme } = useCustomThemeStore.getState();

      const id = addPresetTheme(999);

      expect(id).toBeNull();
    });
  });

  describe("themeColorsToCssVars", () => {
    it("should convert colors to CSS variable format", () => {
      const vars = themeColorsToCssVars(DEFAULT_THEME_COLORS);

      expect(vars["--background"]).toBe(DEFAULT_THEME_COLORS.background);
      expect(vars["--foreground"]).toBe(DEFAULT_THEME_COLORS.foreground);
      expect(vars["--primary"]).toBe(DEFAULT_THEME_COLORS.primary);
      expect(vars["--card-foreground"]).toBe(
        DEFAULT_THEME_COLORS.cardForeground
      );
      expect(vars["--sidebar-primary-foreground"]).toBe(
        DEFAULT_THEME_COLORS.sidebarPrimaryForeground
      );
    });

    it("should include all chart colors", () => {
      const vars = themeColorsToCssVars(DEFAULT_THEME_COLORS);

      expect(vars["--chart-1"]).toBeDefined();
      expect(vars["--chart-2"]).toBeDefined();
      expect(vars["--chart-3"]).toBeDefined();
      expect(vars["--chart-4"]).toBeDefined();
      expect(vars["--chart-5"]).toBeDefined();
    });
  });

  describe("applyCustomTheme", () => {
    beforeEach(() => {
      // Clean up any existing custom theme state
      document.documentElement.classList.remove("custom-theme");
    });

    it("should add custom-theme class when theme is provided", () => {
      const theme: CustomTheme = {
        id: "test",
        name: "Test",
        colors: DEFAULT_THEME_COLORS,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      applyCustomTheme(theme);

      expect(document.documentElement.classList.contains("custom-theme")).toBe(
        true
      );
    });

    it("should set CSS variables when theme is provided", () => {
      const theme: CustomTheme = {
        id: "test",
        name: "Test",
        colors: {
          ...DEFAULT_THEME_COLORS,
          primary: "oklch(0.5 0.2 200)",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      applyCustomTheme(theme);

      expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
        "oklch(0.5 0.2 200)"
      );
    });

    it("should set radius when provided", () => {
      const theme: CustomTheme = {
        id: "test",
        name: "Test",
        colors: DEFAULT_THEME_COLORS,
        radius: "1rem",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      applyCustomTheme(theme);

      expect(document.documentElement.style.getPropertyValue("--radius")).toBe(
        "1rem"
      );
    });

    it("should remove custom-theme class when null is provided", () => {
      // First apply a theme
      const theme: CustomTheme = {
        id: "test",
        name: "Test",
        colors: DEFAULT_THEME_COLORS,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      applyCustomTheme(theme);

      // Then remove it
      applyCustomTheme(null);

      expect(document.documentElement.classList.contains("custom-theme")).toBe(
        false
      );
    });
  });
});
