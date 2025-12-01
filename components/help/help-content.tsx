"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
  AlertCircle,
  Home,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HelpSidebar } from "./help-sidebar";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  getNavigation,
  loadHelpContent,
  getBreadcrumbs,
  getDocLanguage,
  type DocNavItem,
} from "@/lib/ui";

export function HelpContent() {
  const { t, i18n } = useTranslation();
  const [currentPath, setCurrentPath] = useState("index.md");
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = getNavigation(i18n.language);
  const breadcrumbs = getBreadcrumbs(navigation, currentPath);
  const docLang = getDocLanguage(i18n.language);

  // Load content when path or language changes
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const markdown = await loadHelpContent(currentPath, i18n.language);
      setContent(markdown);
    } catch (err) {
      console.error("Failed to load content:", err);
      setError(t("help.load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, i18n.language, t]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Handle navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSidebarOpen(false);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find previous and next pages for navigation
  const flattenNav = (items: DocNavItem[]): DocNavItem[] => {
    const result: DocNavItem[] = [];
    for (const item of items) {
      if (!item.children) {
        result.push(item);
      }
      if (item.children) {
        result.push(...flattenNav(item.children));
      }
    }
    return result;
  };

  const flatNav = flattenNav(navigation);
  const currentIndex = flatNav.findIndex((item) => item.path === currentPath);
  const prevPage = currentIndex > 0 ? flatNav[currentIndex - 1] : null;
  const nextPage =
    currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("help.back_to_app")}
                </span>
              </Button>
            </Link>
          </div>

          <h1 className="text-lg font-semibold truncate">{t("help.title")}</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <a
                href={`https://njupt-sast-cxx.github.io/sast-readium-web/${docLang}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t("help.full_docs")}
              </a>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 px-4 pb-2 text-sm text-muted-foreground overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => handleNavigate("index.md")}
            >
              <Home className="h-3 w-3" />
            </Button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium truncate max-w-[150px]">
                    {crumb.title}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleNavigate(crumb.path)}
                  >
                    {crumb.title}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <HelpSidebar
            navigation={navigation}
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        </aside>

        {/* Sidebar - Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-14 bottom-0 w-72 bg-background shadow-lg">
              <HelpSidebar
                navigation={navigation}
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">{t("help.loading")}</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-destructive font-medium">{error}</p>
                  <Button variant="outline" onClick={loadContent}>
                    {t("help.retry")}
                  </Button>
                </div>
              ) : (
                <>
                  <MarkdownRenderer
                    content={content}
                    docPath={currentPath}
                    language={docLang}
                  />

                  {/* Page navigation */}
                  <div className="flex items-center justify-between mt-12 pt-6 border-t">
                    {prevPage ? (
                      <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => handleNavigate(prevPage.path)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {prevPage.title}
                        </span>
                        <span className="sm:hidden">{t("help.previous")}</span>
                      </Button>
                    ) : (
                      <div />
                    )}
                    {nextPage && (
                      <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => handleNavigate(nextPage.path)}
                      >
                        <span className="hidden sm:inline">
                          {nextPage.title}
                        </span>
                        <span className="sm:hidden">{t("help.next")}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
