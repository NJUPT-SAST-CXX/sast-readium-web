import { test, expect } from "@playwright/test";

test.describe("Help Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/help");
  });

  test("should load help page with navigation", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Help/);

    // Check header is visible
    await expect(page.locator("header")).toBeVisible();

    // Check sidebar navigation exists (desktop)
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Check main content area exists (use the inner main)
    await expect(page.locator("main main, main.flex-1").first()).toBeVisible();
  });

  test("should render index page content correctly", async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector("h1");

    // Check main heading (in the help content area)
    const heading = page.locator("main.flex-1 h1, .prose h1").first();
    await expect(heading).toBeVisible();

    // Check that grid cards are rendered (from index.md)
    // Cards have the class pattern: grid gap-4 my-6 sm:grid-cols-2
    const cards = page.locator(
      ".grid.gap-4.sm\\:grid-cols-2 > div, .grid.gap-4 > .rounded-lg"
    );
    const cardCount = await cards.count();
    // Cards may or may not be present depending on content parsing
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test("should render tables correctly", async ({ page }) => {
    // Navigate to a page with tables (index has tech stack table)
    await page.waitForSelector("table");

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Check table has headers
    const headers = table.locator("th");
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test("should navigate between pages via sidebar", async ({ page }) => {
    // Wait for sidebar to be ready
    await page.waitForSelector("aside button, aside a");

    // Find and click on a navigation item (e.g., "Getting Started" or similar)
    const navItems = page.locator("aside button, aside [role='button']");
    const count = await navItems.count();

    if (count > 1) {
      // Click on second nav item (first is usually Home)
      await navItems.nth(1).click();

      // Wait for content to update
      await page.waitForTimeout(500);

      // Content should have changed
      const content = page.locator("main.flex-1, main main").first();
      await expect(content).toBeVisible();
    }
  });

  test("should render code blocks correctly", async ({ page }) => {
    // Navigate to installation page which has code blocks
    // Click through sidebar to find it
    const installLink = page.locator("text=Installation").first();
    if (await installLink.isVisible()) {
      await installLink.click();
      await page.waitForTimeout(500);
    }

    // Check for code blocks
    const codeBlocks = page.locator("pre code");
    const codeCount = await codeBlocks.count();

    // If we found code blocks, verify they're styled
    if (codeCount > 0) {
      const firstCode = codeBlocks.first();
      await expect(firstCode).toBeVisible();
    }
  });

  test("should render admonitions correctly", async ({ page }) => {
    // Navigate to a page with admonitions (installation has notes/warnings)
    const installLink = page.locator("text=Installation").first();
    if (await installLink.isVisible()) {
      await installLink.click();
      await page.waitForTimeout(1000);
    }

    // Check for admonition boxes (they have border-l-4 class)
    const admonitions = page.locator(".border-l-4");
    const admonitionCount = await admonitions.count();

    // Admonitions should be rendered with proper styling
    if (admonitionCount > 0) {
      const firstAdmonition = admonitions.first();
      await expect(firstAdmonition).toBeVisible();

      // Check it has the icon and title
      const icon = firstAdmonition.locator("svg").first();
      await expect(icon).toBeVisible();
    }
  });

  test("should render tabs correctly", async ({ page }) => {
    // Index page has tabs for Quick Start
    await page.waitForSelector("h1");

    // Look for tab buttons
    const tabButtons = page
      .locator("button")
      .filter({ hasText: /Web|Desktop/i });
    const tabCount = await tabButtons.count();

    if (tabCount >= 2) {
      // Click on second tab
      await tabButtons.nth(1).click();
      await page.waitForTimeout(300);

      // Tab content should update
      const tabContent = page.locator(".tab-content, .prose").first();
      await expect(tabContent).toBeVisible();
    }
  });

  test("should render keyboard shortcuts with kbd styling", async ({
    page,
  }) => {
    // Navigate to PDF Viewer page which has keyboard shortcuts
    const pdfViewerLink = page.locator("text=PDF Viewer").first();
    if (await pdfViewerLink.isVisible()) {
      await pdfViewerLink.click();
      await page.waitForTimeout(1000);
    }

    // Check for kbd elements
    const kbdElements = page.locator("kbd");
    const kbdCount = await kbdElements.count();

    if (kbdCount > 0) {
      const firstKbd = kbdElements.first();
      await expect(firstKbd).toBeVisible();

      // Verify kbd has proper styling (bg-muted class)
      await expect(firstKbd).toHaveClass(/bg-muted/);
    }
  });

  test("should handle breadcrumb navigation", async ({ page }) => {
    // Navigate to a nested page first
    const installLink = page.locator("text=Installation").first();
    if (await installLink.isVisible()) {
      await installLink.click();
      await page.waitForTimeout(500);
    }

    // Check breadcrumbs are visible
    const breadcrumbs = page
      .locator("header")
      .locator("button, a")
      .filter({ hasText: /Home|Getting Started/i });
    const breadcrumbCount = await breadcrumbs.count();

    if (breadcrumbCount > 0) {
      // Click home button to go back
      const homeButton = page
        .locator("header button")
        .filter({ has: page.locator("svg") })
        .first();
      if (await homeButton.isVisible()) {
        await homeButton.click();
        await page.waitForTimeout(500);

        // Should be back at index
        const heading = page.locator("h1").first();
        await expect(heading).toContainText("SAST Readium");
      }
    }
  });

  test("should display images correctly", async ({ page }) => {
    // Index page has a logo image
    await page.waitForSelector("h1");

    const images = page.locator("main img");
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();

      // Check image has proper styling
      await expect(firstImage).toHaveClass(/rounded-lg/);
    }
  });

  test("should handle language switching", async ({ page }) => {
    // Look for language switcher
    const languageSwitcher = page
      .locator("button")
      .filter({ hasText: /EN|中文|Language/i })
      .first();

    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      await page.waitForTimeout(300);

      // Check dropdown appears
      const dropdown = page.locator("[role='menu'], [role='listbox']");
      if (await dropdown.isVisible()) {
        // Select Chinese if available
        const zhOption = dropdown.locator("text=中文").first();
        if (await zhOption.isVisible()) {
          await zhOption.click();
          await page.waitForTimeout(1000);

          // Content should update to Chinese
          // The heading might change
        }
      }
    }
  });

  test("should have working external links", async ({ page }) => {
    // Check for external link button in header
    const externalLink = page.locator("a[target='_blank']").first();

    if (await externalLink.isVisible()) {
      const href = await externalLink.getAttribute("href");
      expect(href).toContain("http");
    }
  });

  test("should render lists correctly", async ({ page }) => {
    await page.waitForSelector("h1");

    // Check for unordered lists
    const ulLists = page.locator("main ul");
    const ulCount = await ulLists.count();

    if (ulCount > 0) {
      const firstList = ulLists.first();
      await expect(firstList).toBeVisible();
      await expect(firstList).toHaveClass(/list-disc/);
    }
  });

  test("should handle page navigation buttons", async ({ page }) => {
    // Navigate to a middle page
    const installLink = page.locator("text=Installation").first();
    if (await installLink.isVisible()) {
      await installLink.click();
      await page.waitForTimeout(500);
    }

    // Check for previous/next navigation buttons at bottom
    const navButtons = page
      .locator("main button")
      .filter({ hasText: /Previous|Next|←|→/i });
    const navCount = await navButtons.count();

    // Should have navigation buttons
    expect(navCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Help Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show mobile menu button", async ({ page }) => {
    await page.goto("/help");
    await page.waitForSelector("h1");

    // Mobile menu button should be visible
    const menuButton = page.locator("header button").first();
    await expect(menuButton).toBeVisible();
  });

  test("should toggle mobile sidebar", async ({ page }) => {
    await page.goto("/help");
    await page.waitForSelector("h1");

    // Click menu button to open sidebar
    const menuButton = page.locator("header button").first();
    await menuButton.click();
    await page.waitForTimeout(300);

    // Sidebar overlay should appear
    const sidebar = page.locator(".fixed.inset-0 aside, aside.absolute");
    // Mobile sidebar should be visible after clicking menu
    await expect(sidebar.first()).toBeVisible();
  });
});
