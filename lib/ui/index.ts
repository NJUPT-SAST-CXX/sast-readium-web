/**
 * UI Module - UI-related utilities and state management
 *
 * This module provides:
 * - Custom theme management
 * - Help content loading
 * - WebGL rendering utilities
 */

// Custom Theme Store
export {
  useCustomThemeStore,
  themeColorsToCssVars,
  applyCustomTheme,
  loadCustomThemesFromDesktop,
  saveCustomThemesToDesktop,
  setupDesktopThemeSync,
  BUILTIN_THEMES,
  DEFAULT_THEME_COLORS,
  type CustomThemeColors,
  type CustomTheme,
  type ThemeExportData,
} from "./custom-theme-store";

// Help Content
export {
  docNavigation,
  getDocLanguage,
  getNavigation,
  findNavItem,
  getBreadcrumbs,
  loadHelpContent,
  clearContentCache,
  preloadContent,
  type DocNavItem,
} from "./help-content";

// WebGL exports
export * from "./webgl";
