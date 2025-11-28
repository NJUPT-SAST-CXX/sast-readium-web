"use client";

import { useEffect } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import { isTauri, loadDesktopPreferences } from "@/lib/tauri-bridge";
import {
  useCustomThemeStore,
  applyCustomTheme,
  loadCustomThemesFromDesktop,
  setupDesktopThemeSync,
} from "@/lib/custom-theme-store";

export function ThemeManager() {
  const { themeMode, isDarkMode } = usePDFStore();
  const { activeCustomThemeId, customThemes } = useCustomThemeStore();

  // Load desktop preferences and custom themes on mount (Tauri only)
  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;

    (async () => {
      try {
        // Load general preferences
        const prefs = await loadDesktopPreferences();
        if (!prefs || cancelled) return;

        usePDFStore.setState((state) => {
          const next: Partial<ReturnType<typeof usePDFStore.getState>> &
            Record<string, unknown> = {};

          if (prefs.themeMode && state.themeMode !== prefs.themeMode) {
            next.themeMode = prefs.themeMode;
            if (prefs.themeMode === "light") {
              next.isDarkMode = false;
            } else if (prefs.themeMode === "dark") {
              next.isDarkMode = true;
            }
          }

          if (typeof prefs.enableSplashScreen === "boolean") {
            next.enableSplashScreen = prefs.enableSplashScreen;
          }

          if (prefs.pdfLoadingAnimation) {
            next.pdfLoadingAnimation = prefs.pdfLoadingAnimation;
          }

          if (Object.keys(next).length === 0) {
            return state;
          }

          return { ...state, ...next };
        });

        // Load custom themes from desktop storage
        await loadCustomThemesFromDesktop();

        // Set active custom theme if stored in preferences
        if (prefs.activeCustomThemeId) {
          useCustomThemeStore.setState({
            activeCustomThemeId: prefs.activeCustomThemeId,
          });
        }
      } catch (error) {
        console.error(
          "Failed to load desktop preferences in ThemeManager",
          error
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Setup auto-sync for custom themes to desktop storage (Tauri only)
  useEffect(() => {
    const cleanup = setupDesktopThemeSync();
    return cleanup;
  }, []);

  useEffect(() => {
    if (themeMode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        // Only update if the calculated mode differs from current isDarkMode
        // We need to be careful not to loop if toggleDarkMode triggers a state change that we don't want?
        // Actually, toggleDarkMode toggles it. We want to SET it.
        // But pdf-store doesn't have a setDarkMode(bool), only toggle.
        // We should probably check the store's current isDarkMode vs the desired one.

        const systemIsDark = e.matches;

        // We need to access the FRESH isDarkMode from store, but here we might have a stale one in closure if we don't include it in dependency.
        // However, putting isDarkMode in dependency might cause loops.
        // Better to rely on the store state directly or add a setDarkMode action.
        // But looking at the store: toggleDarkMode sets themeMode to manual.
        // We should update the store to have a setDarkModeInternal that doesn't change themeMode?
        // Or just use the toggle if needed.

        usePDFStore.setState((state) => {
          if (state.themeMode === "auto") {
            if (state.isDarkMode !== systemIsDark) {
              return { isDarkMode: systemIsDark };
            }
          }
          return {};
        });
      };

      // Initial check
      handleChange(mediaQuery);

      // Listen for changes
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]); // Re-run if themeMode changes to/from auto

  // Also apply the class to html or body if needed, but usually Next.js / Tailwind handles 'dark' class.
  // If using 'class' strategy in Tailwind, we need to add 'dark' class to document.documentElement
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Apply sepia class for sepia theme mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === "sepia") {
      root.classList.add("sepia");
    } else {
      root.classList.remove("sepia");
    }
  }, [themeMode]);

  // Apply custom theme CSS variables when active
  useEffect(() => {
    if (activeCustomThemeId) {
      const theme = customThemes.find((t) => t.id === activeCustomThemeId);
      if (theme) {
        applyCustomTheme(theme);
      }
    } else {
      applyCustomTheme(null);
    }
  }, [activeCustomThemeId, customThemes]);

  return null;
}
