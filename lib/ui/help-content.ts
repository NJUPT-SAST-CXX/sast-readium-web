/**
 * Help content utilities for loading and managing documentation
 */

export interface DocNavItem {
  title: string;
  path: string;
  children?: DocNavItem[];
}

// Navigation structure matching mkdocs.yml
export const docNavigation: Record<string, DocNavItem[]> = {
  en: [
    { title: "Home", path: "index.md" },
    {
      title: "Getting Started",
      path: "getting-started",
      children: [
        { title: "Prerequisites", path: "getting-started/prerequisites.md" },
        { title: "Installation", path: "getting-started/installation.md" },
        { title: "Quick Start", path: "getting-started/quick-start.md" },
      ],
    },
    {
      title: "Architecture",
      path: "architecture",
      children: [
        { title: "Overview", path: "architecture/overview.md" },
        {
          title: "Project Structure",
          path: "architecture/project-structure.md",
        },
        { title: "State Management", path: "architecture/state-management.md" },
        { title: "Styling & Theming", path: "architecture/styling.md" },
        { title: "Internationalization", path: "architecture/i18n.md" },
      ],
    },
    {
      title: "Features",
      path: "features",
      children: [
        { title: "PDF Viewer", path: "features/pdf-viewer.md" },
        { title: "Annotations", path: "features/annotations.md" },
        { title: "Custom Themes", path: "features/custom-themes.md" },
        { title: "AI Assistant", path: "features/ai-assistant.md" },
        { title: "Text-to-Speech", path: "features/tts.md" },
        { title: "Archive Support", path: "features/archive-support.md" },
        { title: "Keyboard Shortcuts", path: "features/keyboard-shortcuts.md" },
      ],
    },
    {
      title: "Development",
      path: "development",
      children: [
        { title: "Scripts & Commands", path: "development/scripts.md" },
        { title: "Coding Standards", path: "development/coding-standards.md" },
        { title: "Testing Guide", path: "development/testing.md" },
        { title: "CI/CD Pipeline", path: "development/ci-cd.md" },
        { title: "Troubleshooting", path: "development/troubleshooting.md" },
      ],
    },
    {
      title: "Deployment",
      path: "deployment",
      children: [
        { title: "Web Deployment", path: "deployment/web.md" },
        { title: "Desktop Packaging", path: "deployment/desktop.md" },
        { title: "Release Process", path: "deployment/release.md" },
      ],
    },
    {
      title: "API Reference",
      path: "api",
      children: [
        { title: "PDF Store", path: "api/pdf-store.md" },
        { title: "AI Service", path: "api/ai-service.md" },
        { title: "Tauri Commands", path: "api/tauri-commands.md" },
      ],
    },
    { title: "Contributing", path: "contributing.md" },
  ],
  zh: [
    { title: "首页", path: "index.md" },
    {
      title: "快速开始",
      path: "getting-started",
      children: [
        { title: "前置要求", path: "getting-started/prerequisites.md" },
        { title: "安装", path: "getting-started/installation.md" },
        { title: "快速入门", path: "getting-started/quick-start.md" },
      ],
    },
    {
      title: "架构",
      path: "architecture",
      children: [
        { title: "概述", path: "architecture/overview.md" },
        { title: "项目结构", path: "architecture/project-structure.md" },
        { title: "状态管理", path: "architecture/state-management.md" },
        { title: "样式与主题", path: "architecture/styling.md" },
        { title: "国际化", path: "architecture/i18n.md" },
      ],
    },
    {
      title: "功能特性",
      path: "features",
      children: [
        { title: "PDF 阅读器", path: "features/pdf-viewer.md" },
        { title: "注释工具", path: "features/annotations.md" },
        { title: "自定义主题", path: "features/custom-themes.md" },
        { title: "AI 助手", path: "features/ai-assistant.md" },
        { title: "文本转语音", path: "features/tts.md" },
        { title: "压缩包支持", path: "features/archive-support.md" },
        { title: "键盘快捷键", path: "features/keyboard-shortcuts.md" },
      ],
    },
    {
      title: "开发指南",
      path: "development",
      children: [
        { title: "脚本与命令", path: "development/scripts.md" },
        { title: "编码规范", path: "development/coding-standards.md" },
        { title: "测试指南", path: "development/testing.md" },
        { title: "CI/CD 流水线", path: "development/ci-cd.md" },
        { title: "故障排除", path: "development/troubleshooting.md" },
      ],
    },
    {
      title: "部署",
      path: "deployment",
      children: [
        { title: "Web 部署", path: "deployment/web.md" },
        { title: "桌面打包", path: "deployment/desktop.md" },
        { title: "发布流程", path: "deployment/release.md" },
      ],
    },
    {
      title: "API 参考",
      path: "api",
      children: [
        { title: "PDF 状态存储", path: "api/pdf-store.md" },
        { title: "AI 服务", path: "api/ai-service.md" },
        { title: "Tauri 命令", path: "api/tauri-commands.md" },
      ],
    },
    { title: "贡献指南", path: "contributing.md" },
  ],
};

/**
 * Get the language code for documentation (en or zh)
 */
export function getDocLanguage(language: string): "en" | "zh" {
  if (language.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

/**
 * Get navigation items for a specific language
 */
export function getNavigation(language: string): DocNavItem[] {
  const lang = getDocLanguage(language);
  return docNavigation[lang] || docNavigation.en;
}

/**
 * Find a navigation item by path
 */
export function findNavItem(
  items: DocNavItem[],
  path: string
): DocNavItem | null {
  for (const item of items) {
    if (item.path === path) {
      return item;
    }
    if (item.children) {
      const found = findNavItem(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get breadcrumb trail for a path
 */
export function getBreadcrumbs(
  items: DocNavItem[],
  path: string
): DocNavItem[] {
  const breadcrumbs: DocNavItem[] = [];

  function search(navItems: DocNavItem[], trail: DocNavItem[]): boolean {
    for (const item of navItems) {
      const newTrail = [...trail, item];
      if (item.path === path) {
        breadcrumbs.push(...newTrail);
        return true;
      }
      if (item.children && search(item.children, newTrail)) {
        return true;
      }
    }
    return false;
  }

  search(items, []);
  return breadcrumbs;
}

// Content cache to avoid re-fetching
const contentCache = new Map<string, string>();

/**
 * Load markdown content for a specific path and language
 * Docs are served from /docs/ in public folder
 */
export async function loadHelpContent(
  docPath: string,
  language: string
): Promise<string> {
  const lang = getDocLanguage(language);
  const cacheKey = `${lang}/${docPath}`;

  // Check cache first
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!;
  }

  try {
    // Try to load from the docs directory (served from public/docs)
    const response = await fetch(`/docs/${lang}/${docPath}`);
    if (response.ok) {
      const content = await response.text();
      contentCache.set(cacheKey, content);
      return content;
    }

    // Fallback to English if the localized version doesn't exist
    if (lang !== "en") {
      const fallbackResponse = await fetch(`/docs/en/${docPath}`);
      if (fallbackResponse.ok) {
        const content = await fallbackResponse.text();
        contentCache.set(cacheKey, content);
        return content;
      }
    }

    throw new Error(`Failed to load: ${docPath}`);
  } catch (error) {
    console.error("Failed to load help content:", error);
    throw error;
  }
}

/**
 * Clear the content cache
 */
export function clearContentCache(): void {
  contentCache.clear();
}

/**
 * Preload content for faster navigation
 */
export async function preloadContent(
  paths: string[],
  language: string
): Promise<void> {
  await Promise.all(
    paths.map((path) => loadHelpContent(path, language).catch(() => null))
  );
}
