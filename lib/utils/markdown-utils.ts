/**
 * Markdown utility functions for parsing and processing markdown content.
 * These functions are designed to be pure and easily testable.
 */

// ============================================================================
// Types
// ============================================================================

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export interface ParsedAdmonition {
  type: string;
  title: string;
  content: string;
  position: number;
}

export interface AdmonitionParseResult {
  admonitions: ParsedAdmonition[];
  processed: string;
}

// ============================================================================
// Slug Generation
// ============================================================================

/**
 * Generate a URL-friendly slug from text.
 * Supports Unicode characters (CJK, etc.) and handles duplicates.
 *
 * @param text - The text to slugify
 * @param existingSlugs - Optional set of existing slugs to avoid duplicates
 * @returns A URL-friendly slug
 */
export function slugify(text: string, existingSlugs?: Set<string>): string {
  let slug = text
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, "-")
    // Remove characters that are not alphanumeric, CJK, hyphens, or underscores
    .replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]/g, "")
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  // Handle empty slug
  if (!slug) {
    slug = "heading";
  }

  // Handle duplicates if existingSlugs is provided
  if (existingSlugs) {
    if (existingSlugs.has(slug)) {
      let counter = 1;
      while (existingSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    existingSlugs.add(slug);
  }

  return slug;
}

// ============================================================================
// Heading Extraction
// ============================================================================

/**
 * Extract headings from markdown content for table of contents.
 * Handles duplicate headings by appending numeric suffixes.
 *
 * @param markdown - The markdown content to parse
 * @returns Array of TOC items with id, text, and level
 */
export function extractHeadings(markdown: string): TOCItem[] {
  const headings: TOCItem[] = [];
  const lines = markdown.split("\n");
  const existingSlugs = new Set<string>();

  for (const line of lines) {
    // Match ATX-style headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      // Remove inline formatting markers but keep the text
      const text = match[2]
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
        .replace(/\*([^*]+)\*/g, "$1") // Italic
        .replace(/__([^_]+)__/g, "$1") // Bold (underscore)
        .replace(/_([^_]+)_/g, "$1") // Italic (underscore)
        .replace(/`([^`]+)`/g, "$1") // Inline code
        .replace(/~~([^~]+)~~/g, "$1") // Strikethrough
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
        .trim();

      const id = slugify(text, existingSlugs);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

// ============================================================================
// Admonition Parsing
// ============================================================================

/**
 * Admonition types with their default titles
 */
export const ADMONITION_TYPES: Record<string, string> = {
  note: "Note",
  info: "Info",
  tip: "Tip",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
  error: "Error",
  bug: "Bug",
  example: "Example",
  quote: "Quote",
  abstract: "Abstract",
  question: "Question",
  failure: "Failure",
  important: "Important",
};

/**
 * Parse MkDocs-style admonitions from markdown content.
 * Supports both `!!!` (block) and `???` (collapsible) syntax.
 * Handles 4-space or tab indentation for content.
 *
 * @param markdown - The markdown content to parse
 * @returns Object containing parsed admonitions and processed markdown with placeholders
 */
export function parseAdmonitions(markdown: string): AdmonitionParseResult {
  const admonitions: ParsedAdmonition[] = [];
  let placeholderIndex = 0;

  const lines = markdown.split("\n");
  const result: string[] = [];
  let inAdmonition = false;
  let currentType = "";
  let currentTitle = "";
  let currentContent: string[] = [];

  const flushAdmonition = () => {
    if (currentType) {
      const placeholder = `__ADMONITION_${placeholderIndex}__`;
      admonitions.push({
        type: currentType,
        title: currentTitle,
        content: currentContent.join("\n").trim(),
        position: placeholderIndex,
      });
      placeholderIndex++;
      result.push(placeholder);
    }
    inAdmonition = false;
    currentType = "";
    currentTitle = "";
    currentContent = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match admonition start: !!! type "optional title" or ??? type "optional title"
    const admonitionMatch = line.match(
      /^(!!!|\?\?\?)\s+(\w+)(?:\s+"([^"]*)")?$/
    );

    if (admonitionMatch) {
      // Flush any existing admonition
      if (inAdmonition) {
        flushAdmonition();
      }

      currentType = admonitionMatch[2].toLowerCase();
      currentTitle =
        admonitionMatch[3] || ADMONITION_TYPES[currentType] || currentType;
      currentContent = [];
      inAdmonition = true;
      continue;
    }

    if (inAdmonition) {
      // Check if line is indented (4 spaces or tab) or empty
      if (
        line.startsWith("    ") ||
        line.startsWith("\t") ||
        line.trim() === ""
      ) {
        // Remove the indentation and add to content
        const contentLine = line.startsWith("\t")
          ? line.substring(1)
          : line.startsWith("    ")
            ? line.substring(4)
            : line;
        currentContent.push(contentLine);
        continue;
      } else {
        // End of admonition - non-indented, non-empty line
        flushAdmonition();
        result.push(line);
        continue;
      }
    }

    result.push(line);
  }

  // Flush any remaining admonition at end of file
  if (inAdmonition) {
    flushAdmonition();
  }

  return { admonitions, processed: result.join("\n") };
}

// ============================================================================
// Keyboard Shortcut Processing
// ============================================================================

/**
 * Convert keyboard shortcut syntax ++key++ to <kbd> elements.
 * Supports compound shortcuts like ++ctrl+shift+p++
 *
 * @param markdown - The markdown content to process
 * @returns Markdown with keyboard shortcuts converted to <kbd> elements
 */
export function processKeyboardShortcuts(markdown: string): string {
  return markdown.replace(/\+\+([^+]+(?:\+[^+]+)*)\+\+/g, (_, keys: string) => {
    const keyList = keys.split("+").map((k: string) => k.trim());
    return keyList.map((k: string) => `<kbd>${k}</kbd>`).join("+");
  });
}

// ============================================================================
// Content Statistics
// ============================================================================

export interface ContentStats {
  words: number;
  characters: number;
  lines: number;
  headings: number;
  codeBlocks: number;
  links: number;
  images: number;
}

/**
 * Calculate statistics for markdown content.
 *
 * @param markdown - The markdown content to analyze
 * @returns Statistics object with word count, character count, etc.
 */
export function getContentStats(markdown: string): ContentStats {
  const lines = markdown.split("\n");

  // Word count (split by whitespace, filter empty)
  const words = markdown.trim()
    ? markdown.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Character count
  const characters = markdown.length;

  // Line count
  const lineCount = lines.length;

  // Heading count
  const headings = lines.filter((line) => /^#{1,6}\s+/.test(line)).length;

  // Code block count (fenced code blocks)
  const codeBlockMatches = markdown.match(/```[\s\S]*?```/g);
  const codeBlocks = codeBlockMatches ? codeBlockMatches.length : 0;

  // Link count (excluding images)
  const linkMatches = markdown.match(/(?<!!)\[([^\]]+)\]\([^)]+\)/g);
  const links = linkMatches ? linkMatches.length : 0;

  // Image count
  const imageMatches = markdown.match(/!\[([^\]]*)\]\([^)]+\)/g);
  const images = imageMatches ? imageMatches.length : 0;

  return {
    words,
    characters,
    lines: lineCount,
    headings,
    codeBlocks,
    links,
    images,
  };
}

// ============================================================================
// Search Utilities
// ============================================================================

export interface SearchResult {
  index: number;
  text: string;
  context: string;
  lineNumber: number;
}

/**
 * Search for text in markdown content.
 *
 * @param content - The content to search in
 * @param query - The search query
 * @param caseSensitive - Whether the search should be case-sensitive
 * @returns Array of search results with context
 */
export function searchInContent(
  content: string,
  query: string,
  caseSensitive = false
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  const lines = content.split("\n");

  let charIndex = 0;
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const searchLine = caseSensitive ? line : line.toLowerCase();
    let lineIndex = 0;

    while (true) {
      const foundIndex = searchLine.indexOf(searchQuery, lineIndex);
      if (foundIndex === -1) break;

      // Extract context (30 chars before and after)
      const contextStart = Math.max(0, foundIndex - 30);
      const contextEnd = Math.min(line.length, foundIndex + query.length + 30);
      const context =
        (contextStart > 0 ? "..." : "") +
        line.substring(contextStart, contextEnd) +
        (contextEnd < line.length ? "..." : "");

      results.push({
        index: charIndex + foundIndex,
        text: line.substring(foundIndex, foundIndex + query.length),
        context,
        lineNumber: lineNum + 1,
      });

      lineIndex = foundIndex + 1;
    }

    charIndex += line.length + 1; // +1 for newline
  }

  return results;
}

// ============================================================================
// Markdown Validation
// ============================================================================

export interface ValidationIssue {
  type: "warning" | "error";
  message: string;
  line: number;
}

/**
 * Validate markdown content for common issues.
 *
 * @param markdown - The markdown content to validate
 * @returns Array of validation issues
 */
export function validateMarkdown(markdown: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = markdown.split("\n");

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track code blocks
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip validation inside code blocks
    if (inCodeBlock) continue;

    // Check for trailing spaces (except in code blocks)
    if (line.endsWith("  ") && !line.endsWith("   ")) {
      // Two trailing spaces is intentional line break, but more is suspicious
    } else if (/\s+$/.test(line) && line.trim() !== "") {
      issues.push({
        type: "warning",
        message: "Trailing whitespace",
        line: lineNum,
      });
    }

    // Check for broken links (empty href)
    if (/\[([^\]]+)\]\(\s*\)/.test(line)) {
      issues.push({
        type: "error",
        message: "Empty link URL",
        line: lineNum,
      });
    }

    // Check for broken images (empty src)
    if (/!\[([^\]]*)\]\(\s*\)/.test(line)) {
      issues.push({
        type: "error",
        message: "Empty image URL",
        line: lineNum,
      });
    }

    // Check for unclosed inline code
    const backtickCount = (line.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0 && !line.includes("```")) {
      issues.push({
        type: "warning",
        message: "Possibly unclosed inline code",
        line: lineNum,
      });
    }
  }

  // Check for unclosed code block
  if (inCodeBlock) {
    issues.push({
      type: "error",
      message: "Unclosed code block",
      line: lines.length,
    });
  }

  return issues;
}

// ============================================================================
// Line Ending Normalization
// ============================================================================

/**
 * Normalize line endings to LF (\n).
 *
 * @param content - The content to normalize
 * @returns Content with normalized line endings
 */
export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// ============================================================================
// Text Formatting Utilities
// ============================================================================

/**
 * Wrap selected text with formatting markers.
 *
 * @param text - The full text content
 * @param selectionStart - Start index of selection
 * @param selectionEnd - End index of selection
 * @param prefix - Prefix to add (e.g., "**" for bold)
 * @param suffix - Suffix to add (defaults to prefix)
 * @returns Object with new text and new cursor positions
 */
export function wrapTextWithMarkers(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix?: string
): { text: string; selectionStart: number; selectionEnd: number } {
  const actualSuffix = suffix ?? prefix;
  const before = text.substring(0, selectionStart);
  const selected = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);

  const newText = before + prefix + selected + actualSuffix + after;

  return {
    text: newText,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + prefix.length,
  };
}

/**
 * Insert text at cursor position.
 *
 * @param text - The full text content
 * @param cursorPosition - Current cursor position
 * @param insertText - Text to insert
 * @returns Object with new text and new cursor position
 */
export function insertTextAtCursor(
  text: string,
  cursorPosition: number,
  insertText: string
): { text: string; cursorPosition: number } {
  const before = text.substring(0, cursorPosition);
  const after = text.substring(cursorPosition);

  return {
    text: before + insertText + after,
    cursorPosition: cursorPosition + insertText.length,
  };
}

/**
 * Toggle line prefix (e.g., for lists, headings).
 *
 * @param text - The full text content
 * @param lineStart - Start index of the line
 * @param lineEnd - End index of the line
 * @param prefix - Prefix to toggle (e.g., "- " for bullet list)
 * @returns Object with new text and adjustment to cursor position
 */
export function toggleLinePrefix(
  text: string,
  lineStart: number,
  lineEnd: number,
  prefix: string
): { text: string; adjustment: number } {
  const before = text.substring(0, lineStart);
  const line = text.substring(lineStart, lineEnd);
  const after = text.substring(lineEnd);

  if (line.startsWith(prefix)) {
    // Remove prefix
    return {
      text: before + line.substring(prefix.length) + after,
      adjustment: -prefix.length,
    };
  } else {
    // Add prefix
    return {
      text: before + prefix + line + after,
      adjustment: prefix.length,
    };
  }
}

// ============================================================================
// Markdown Generation Helpers
// ============================================================================

/**
 * Generate a markdown table template.
 *
 * @param rows - Number of rows (excluding header)
 * @param cols - Number of columns
 * @returns Markdown table string
 */
export function generateMarkdownTable(rows: number, cols: number): string {
  const header = "| " + Array(cols).fill("Header").join(" | ") + " |";
  const separator = "| " + Array(cols).fill("---").join(" | ") + " |";
  const dataRows = Array(rows)
    .fill(null)
    .map(() => "| " + Array(cols).fill("Cell").join(" | ") + " |");

  return [header, separator, ...dataRows].join("\n");
}

/**
 * Generate a markdown code block.
 *
 * @param code - The code content
 * @param language - Optional language identifier
 * @returns Markdown code block string
 */
export function generateCodeBlock(code: string, language = ""): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Generate a markdown link.
 *
 * @param text - Link text
 * @param url - Link URL
 * @param title - Optional link title
 * @returns Markdown link string
 */
export function generateMarkdownLink(
  text: string,
  url: string,
  title?: string
): string {
  if (title) {
    return `[${text}](${url} "${title}")`;
  }
  return `[${text}](${url})`;
}

/**
 * Generate a markdown image.
 *
 * @param alt - Alt text
 * @param url - Image URL
 * @param title - Optional image title
 * @returns Markdown image string
 */
export function generateMarkdownImage(
  alt: string,
  url: string,
  title?: string
): string {
  if (title) {
    return `![${alt}](${url} "${title}")`;
  }
  return `![${alt}](${url})`;
}

// ============================================================================
// Content Extraction
// ============================================================================

/**
 * Extract plain text from markdown content (removes formatting).
 *
 * @param markdown - The markdown content
 * @returns Plain text without markdown formatting
 */
export function extractPlainText(markdown: string): string {
  return (
    markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Remove strikethrough
      .replace(/~~([^~]+)~~/g, "$1")
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, "")
      // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Get the current line from text at a given cursor position.
 *
 * @param text - The full text content
 * @param cursorPosition - Current cursor position
 * @returns Object with line content and start/end indices
 */
export function getCurrentLine(
  text: string,
  cursorPosition: number
): { line: string; start: number; end: number } {
  let start = cursorPosition;
  let end = cursorPosition;

  // Find start of line
  while (start > 0 && text[start - 1] !== "\n") {
    start--;
  }

  // Find end of line
  while (end < text.length && text[end] !== "\n") {
    end++;
  }

  return {
    line: text.substring(start, end),
    start,
    end,
  };
}

/**
 * Check if cursor is inside a code block.
 *
 * @param text - The full text content
 * @param cursorPosition - Current cursor position
 * @returns True if cursor is inside a code block
 */
export function isInsideCodeBlock(
  text: string,
  cursorPosition: number
): boolean {
  const beforeCursor = text.substring(0, cursorPosition);
  const codeBlockStarts = (beforeCursor.match(/```/g) || []).length;
  return codeBlockStarts % 2 === 1;
}
