import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomThemeManager } from "../custom-theme-editor";
import {
  useCustomThemeStore,
  DEFAULT_THEME_COLORS,
  BUILTIN_THEMES,
} from "@/lib/custom-theme-store";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "custom_theme.title": "Custom Themes",
        "custom_theme.create_theme": "Create Theme",
        "custom_theme.edit_theme": "Edit Theme",
        "custom_theme.editor_description": "Customize colors and appearance",
        "custom_theme.tab.basic": "Basic",
        "custom_theme.tab.colors": "Colors",
        "custom_theme.name": "Theme Name",
        "custom_theme.name_placeholder": "My Custom Theme",
        "custom_theme.description": "Description",
        "custom_theme.description_placeholder": "A brief description",
        "custom_theme.border_radius": "Border Radius",
        "custom_theme.preview": "Preview",
        "custom_theme.preview_card": "Card Preview",
        "custom_theme.preview_button": "Primary Button",
        "custom_theme.preview_secondary": "Secondary",
        "custom_theme.preview_theme": "Preview Theme",
        "custom_theme.stop_preview": "Stop Preview",
        "custom_theme.save": "Save Theme",
        "custom_theme.import": "Import",
        "custom_theme.export": "Export",
        "custom_theme.export_all": "Export All",
        "custom_theme.create_new": "Create New Theme",
        "custom_theme.presets": "Preset Themes",
        "custom_theme.active": "Active Theme",
        "custom_theme.active_badge": "Active",
        "custom_theme.no_themes": "No custom themes yet",
        "custom_theme.no_themes_hint": "Create a new theme or add from presets",
        "custom_theme.apply": "Apply Theme",
        "custom_theme.edit": "Edit",
        "custom_theme.duplicate": "Duplicate",
        "custom_theme.delete": "Delete",
        "custom_theme.theme_created": "Theme created successfully",
        "custom_theme.theme_updated": "Theme updated successfully",
        "custom_theme.theme_deleted": "Theme deleted successfully",
        "custom_theme.theme_duplicated": "Theme duplicated successfully",
        "custom_theme.theme_applied": `Theme "${params?.name}" applied`,
        "custom_theme.theme_deactivated": "Custom theme deactivated",
        "custom_theme.themes_exported": "Themes exported successfully",
        "custom_theme.themes_imported": `${params?.count} theme(s) imported`,
        "custom_theme.import_error": "Failed to import themes",
        "custom_theme.preset_added": "Preset theme added",
        "custom_theme.error.name_required": "Theme name is required",
        "custom_theme.color_group.base": "Base Colors",
        "custom_theme.color_group.primary": "Primary Colors",
        "custom_theme.color_group.utility": "Utility Colors",
        "custom_theme.color_group.sidebar": "Sidebar Colors",
        "custom_theme.color_group.chart": "Chart Colors",
        "custom_theme.color.background": "Background",
        "custom_theme.color.foreground": "Foreground",
        "custom_theme.color.primary": "Primary",
        "dialog.cancel": "Cancel",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:test");
global.URL.revokeObjectURL = jest.fn();

describe("CustomThemeManager", () => {
  beforeEach(() => {
    // Reset store state
    useCustomThemeStore.setState({
      customThemes: [],
      activeCustomThemeId: null,
    });
    jest.clearAllMocks();
  });

  describe("Empty State", () => {
    it("should render empty state when no themes exist", () => {
      render(<CustomThemeManager />);

      expect(screen.getByText("No custom themes yet")).toBeInTheDocument();
      expect(
        screen.getByText("Create a new theme or add from presets")
      ).toBeInTheDocument();
    });

    it("should show title", () => {
      render(<CustomThemeManager />);
      expect(screen.getByText("Custom Themes")).toBeInTheDocument();
    });
  });

  describe("Theme List", () => {
    beforeEach(() => {
      // Add some test themes
      useCustomThemeStore.getState().addTheme({
        name: "Test Theme 1",
        description: "First test theme",
        colors: DEFAULT_THEME_COLORS,
      });
      useCustomThemeStore.getState().addTheme({
        name: "Test Theme 2",
        colors: DEFAULT_THEME_COLORS,
      });
    });

    it("should render list of themes", () => {
      render(<CustomThemeManager />);

      expect(screen.getByText("Test Theme 1")).toBeInTheDocument();
      expect(screen.getByText("Test Theme 2")).toBeInTheDocument();
    });

    it("should show theme description if available", () => {
      render(<CustomThemeManager />);
      expect(screen.getByText("First test theme")).toBeInTheDocument();
    });

    it("should show active badge for active theme", () => {
      const themes = useCustomThemeStore.getState().customThemes;
      useCustomThemeStore.getState().setActiveCustomTheme(themes[0].id);

      render(<CustomThemeManager />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("Theme Actions", () => {
    beforeEach(() => {
      useCustomThemeStore.getState().addTheme({
        name: "Action Test Theme",
        colors: DEFAULT_THEME_COLORS,
      });
    });

    it("should activate theme when apply button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Find and click the apply button (check icon)
      const applyButtons = screen.getAllByRole("button");
      const applyButton = applyButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-check"]') !== null
      );

      if (applyButton) {
        await user.click(applyButton);
      }

      // Theme should be active
      const { activeCustomThemeId, customThemes } =
        useCustomThemeStore.getState();
      expect(activeCustomThemeId).toBe(customThemes[0].id);
    });

    it("should show active theme indicator when theme is active", () => {
      const themes = useCustomThemeStore.getState().customThemes;
      useCustomThemeStore.getState().setActiveCustomTheme(themes[0].id);

      render(<CustomThemeManager />);

      expect(screen.getByText(/Active Theme/)).toBeInTheDocument();
    });

    it("should deactivate theme when X button is clicked on active indicator", async () => {
      const user = userEvent.setup();
      const themes = useCustomThemeStore.getState().customThemes;
      useCustomThemeStore.getState().setActiveCustomTheme(themes[0].id);

      render(<CustomThemeManager />);

      // Find the X button in the active theme indicator
      const activeIndicator = screen.getByText(/Active Theme/).closest("div");
      const closeButton = activeIndicator?.querySelector("button");

      if (closeButton) {
        await user.click(closeButton);
      }

      expect(useCustomThemeStore.getState().activeCustomThemeId).toBeNull();
    });
  });

  describe("Create Theme", () => {
    it("should open create dialog when plus button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Click the plus button to open dropdown
      const plusButtons = screen.getAllByRole("button");
      const plusButton = plusButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-plus"]') !== null
      );

      if (plusButton) {
        await user.click(plusButton);
      }

      // Click "Create New Theme" option
      await waitFor(() => {
        expect(screen.getByText("Create New Theme")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Create New Theme"));

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText("Create Theme")).toBeInTheDocument();
      });
    });
  });

  describe("Preset Themes", () => {
    it("should show preset themes in dropdown", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Click the plus button
      const plusButtons = screen.getAllByRole("button");
      const plusButton = plusButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-plus"]') !== null
      );

      if (plusButton) {
        await user.click(plusButton);
      }

      // Should show preset themes section
      await waitFor(() => {
        expect(screen.getByText("Preset Themes")).toBeInTheDocument();
      });

      // Should show first preset theme name
      expect(screen.getByText(BUILTIN_THEMES[0].name)).toBeInTheDocument();
    });

    it("should add preset theme when clicked", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Click the plus button
      const plusButtons = screen.getAllByRole("button");
      const plusButton = plusButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-plus"]') !== null
      );

      if (plusButton) {
        await user.click(plusButton);
      }

      // Wait for dropdown and click preset
      await waitFor(() => {
        expect(screen.getByText(BUILTIN_THEMES[0].name)).toBeInTheDocument();
      });

      await user.click(screen.getByText(BUILTIN_THEMES[0].name));

      // Theme should be added
      const { customThemes } = useCustomThemeStore.getState();
      expect(customThemes).toHaveLength(1);
      expect(customThemes[0].name).toBe(BUILTIN_THEMES[0].name);
    });
  });

  describe("Import/Export", () => {
    beforeEach(() => {
      useCustomThemeStore.getState().addTheme({
        name: "Export Test",
        colors: DEFAULT_THEME_COLORS,
      });
    });

    it("should have import button", () => {
      render(<CustomThemeManager />);

      const buttons = screen.getAllByRole("button");
      const importButton = buttons.find(
        (btn) => btn.querySelector('svg[class*="lucide-upload"]') !== null
      );

      expect(importButton).toBeInTheDocument();
    });

    it("should have export button when themes exist", () => {
      render(<CustomThemeManager />);

      const buttons = screen.getAllByRole("button");
      const exportButton = buttons.find(
        (btn) => btn.querySelector('svg[class*="lucide-download"]') !== null
      );

      expect(exportButton).toBeInTheDocument();
    });

    it("should disable export button when no themes exist", () => {
      useCustomThemeStore.setState({ customThemes: [] });
      render(<CustomThemeManager />);

      const buttons = screen.getAllByRole("button");
      const exportButton = buttons.find(
        (btn) => btn.querySelector('svg[class*="lucide-download"]') !== null
      );

      expect(exportButton).toBeDisabled();
    });
  });

  describe("Theme More Actions Menu", () => {
    beforeEach(() => {
      useCustomThemeStore.getState().addTheme({
        name: "Menu Test Theme",
        colors: DEFAULT_THEME_COLORS,
      });
    });

    it("should show more actions menu", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Find and click the more actions button (ellipsis icon)
      const moreButtons = screen.getAllByRole("button");
      const moreButton = moreButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-ellipsis"]') !== null
      );

      if (moreButton) {
        await user.click(moreButton);
      }

      // Menu should show edit, duplicate, export, delete options
      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByText("Duplicate")).toBeInTheDocument();
        expect(screen.getByText("Export")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });

    it("should delete theme when delete is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      expect(useCustomThemeStore.getState().customThemes).toHaveLength(1);

      // Open more menu (ellipsis icon)
      const moreButtons = screen.getAllByRole("button");
      const moreButton = moreButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-ellipsis"]') !== null
      );

      if (moreButton) {
        await user.click(moreButton);
      }

      // Click delete
      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Delete"));

      // Theme should be deleted
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(0);
    });

    it("should duplicate theme when duplicate is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomThemeManager />);

      // Open more menu (ellipsis icon)
      const moreButtons = screen.getAllByRole("button");
      const moreButton = moreButtons.find(
        (btn) => btn.querySelector('svg[class*="lucide-ellipsis"]') !== null
      );

      if (moreButton) {
        await user.click(moreButton);
      }

      // Click duplicate
      await waitFor(() => {
        expect(screen.getByText("Duplicate")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Duplicate"));

      // Should have 2 themes now
      expect(useCustomThemeStore.getState().customThemes).toHaveLength(2);
    });
  });

  describe("Color Preview", () => {
    it("should show color preview circles for each theme", () => {
      useCustomThemeStore.getState().addTheme({
        name: "Color Preview Test",
        colors: {
          ...DEFAULT_THEME_COLORS,
          primary: "oklch(0.5 0.2 200)",
        },
      });

      const { container } = render(<CustomThemeManager />);

      // Should have color preview circles (4 per theme in the -space-x-1 container)
      const colorCircles = container.querySelectorAll("div.-space-x-1 > div");

      expect(colorCircles.length).toBeGreaterThan(0);
    });
  });
});

describe("CustomThemeManager className prop", () => {
  it("should apply custom className", () => {
    const { container } = render(
      <CustomThemeManager className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
