export const I18N_STORAGE_KEY = "i18nextLng";

type SupportedLanguage = "en" | "zh";

export function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = localStorage.getItem(I18N_STORAGE_KEY);
  if (!value) {
    return null;
  }
  if (value.startsWith("zh")) {
    return "zh";
  }
  if (value.startsWith("en")) {
    return "en";
  }
  return null;
}

export function setStoredLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(I18N_STORAGE_KEY, language);
}

export function clearStoredLanguage(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(I18N_STORAGE_KEY);
}

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined" || !navigator.language) {
    return "en";
  }
  const language = navigator.language.toLowerCase();
  if (language.startsWith("zh")) {
    return "zh";
  }
  return "en";
}
