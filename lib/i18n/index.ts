/**
 * i18n Module - Internationalization utilities
 *
 * This module provides:
 * - i18next configuration
 * - Language detection and storage helpers
 */

// i18n configuration (default export)
export { default } from "./i18n";

// i18n helpers
export {
  I18N_STORAGE_KEY,
  getStoredLanguage,
  setStoredLanguage,
  clearStoredLanguage,
  detectBrowserLanguage,
} from "./i18n-helpers";
