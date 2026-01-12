"use client";

// Smart paste utilities for markdown editor
// Automatically converts pasted content to markdown

export interface SmartPasteResult {
  content: string;
  type: "plain" | "url" | "html" | "image";
}

// Check if text is a URL
function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Convert HTML to markdown
function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let markdown = "";

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(processNode).join("");

    switch (tag) {
      case "h1":
        return `# ${children}\n\n`;
      case "h2":
        return `## ${children}\n\n`;
      case "h3":
        return `### ${children}\n\n`;
      case "h4":
        return `#### ${children}\n\n`;
      case "h5":
        return `##### ${children}\n\n`;
      case "h6":
        return `###### ${children}\n\n`;
      case "p":
        return `${children}\n\n`;
      case "br":
        return "\n";
      case "strong":
      case "b":
        return `**${children}**`;
      case "em":
      case "i":
        return `*${children}*`;
      case "s":
      case "del":
      case "strike":
        return `~~${children}~~`;
      case "code":
        return `\`${children}\``;
      case "pre":
        const codeEl = el.querySelector("code");
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || "";
        const code = codeEl?.textContent || el.textContent || "";
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
      case "a":
        const href = el.getAttribute("href") || "";
        return `[${children}](${href})`;
      case "img":
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        return `![${alt}](${src})`;
      case "ul":
        return children + "\n";
      case "ol":
        return children + "\n";
      case "li":
        const parent = el.parentElement?.tagName.toLowerCase();
        if (parent === "ol") {
          const index = Array.from(el.parentElement!.children).indexOf(el) + 1;
          return `${index}. ${children}\n`;
        }
        return `- ${children}\n`;
      case "blockquote":
        return (
          children
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n") + "\n\n"
        );
      case "hr":
        return "\n---\n\n";
      case "table":
        return processTable(el);
      case "div":
      case "span":
        return children;
      default:
        return children;
    }
  }

  function processTable(table: HTMLElement): string {
    const rows = table.querySelectorAll("tr");
    if (rows.length === 0) return "";

    let md = "";
    const headers: string[] = [];
    const headerRow = rows[0];

    // Process header row
    headerRow.querySelectorAll("th, td").forEach((cell) => {
      headers.push((cell.textContent || "").trim());
    });

    if (headers.length === 0) return "";

    md += `| ${headers.join(" | ")} |\n`;
    md += `| ${headers.map(() => "---").join(" | ")} |\n`;

    // Process body rows
    for (let i = 1; i < rows.length; i++) {
      const cells: string[] = [];
      rows[i].querySelectorAll("td, th").forEach((cell) => {
        cells.push((cell.textContent || "").trim());
      });
      md += `| ${cells.join(" | ")} |\n`;
    }

    return md + "\n";
  }

  markdown = processNode(doc.body);

  // Clean up excessive newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n");

  return markdown.trim();
}

// Smart paste: convert pasted content based on its type
export function smartPaste(
  clipboardData: DataTransfer,
  selectedText: string = ""
): SmartPasteResult {
  // Check for image data
  const items = Array.from(clipboardData.items);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (imageItem) {
    return {
      content: "",
      type: "image",
    };
  }

  // Check for HTML content
  const html = clipboardData.getData("text/html");
  if (html && html.trim()) {
    const markdown = htmlToMarkdown(html);
    if (markdown) {
      return {
        content: markdown,
        type: "html",
      };
    }
  }

  // Plain text
  const text = clipboardData.getData("text/plain").trim();

  // Check if it's a URL
  if (isUrl(text)) {
    // If there's selected text, make it a link
    if (selectedText) {
      return {
        content: `[${selectedText}](${text})`,
        type: "url",
      };
    }
    // Otherwise, create a link with the URL as text
    return {
      content: `[${text}](${text})`,
      type: "url",
    };
  }

  return {
    content: text,
    type: "plain",
  };
}

// Auto-format pasted URLs based on content type
export async function formatUrlContent(url: string): Promise<string> {
  // YouTube video
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `!video[YouTube Video](${url})`;
  }

  // Image URL
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
    return `![Image](${url})`;
  }

  // GitHub repo
  const githubMatch = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (githubMatch) {
    return `[${githubMatch[1]}](${url})`;
  }

  // Twitter/X post
  const twitterMatch = url.match(
    /(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/
  );
  if (twitterMatch) {
    return `@embed(${url})`;
  }

  // Default: simple link
  return `[${url}](${url})`;
}
