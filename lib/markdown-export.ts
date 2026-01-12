/**
 * Markdown Export Utilities
 * Provides functions to export markdown content to various formats
 */

/**
 * Convert markdown content to a standalone HTML document
 */
export function markdownToHtml(
  content: string,
  title: string = "Markdown Document"
): string {
  // Basic markdown to HTML conversion for export
  // Note: This is a simplified version. For full rendering, use the preview component
  let html = content;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>'
  );

  // Images (must come before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gim, "<hr />");

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");

  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>\n)+/g, "<ul>$&</ul>");

  // Paragraphs
  html = html.replace(/\n\n([^<].*)/g, "\n\n<p>$1</p>");

  // Line breaks
  html = html.replace(/\n/g, "<br />\n");

  // Create full HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 1em;
      color: #666;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    a {
      color: #0066cc;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2em 0;
    }
    ul, ol {
      padding-left: 2em;
    }
    li {
      margin: 0.25em 0;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export markdown as HTML file
 */
export function exportAsHtml(content: string, filename: string): void {
  const title = filename.replace(/\.(md|markdown)$/i, "");
  const html = markdownToHtml(content, title);
  const htmlFilename = title + ".html";
  downloadFile(html, htmlFilename, "text/html");
}

/**
 * Export markdown as plain text file
 */
export function exportAsText(content: string, filename: string): void {
  const textFilename = filename.replace(/\.(md|markdown)$/i, ".txt");
  downloadFile(content, textFilename, "text/plain");
}

/**
 * Export markdown as PDF file using pdf-lib
 * Returns a Blob that can be used to open in PDF viewer or download
 */
export async function exportAsPdfBlob(
  content: string,
  title: string = "Markdown Document"
): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const maxWidth = pageWidth - 2 * margin;

  // Split content into lines
  const lines = content.split("\n");
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Add title
  currentPage.drawText(title, {
    x: margin,
    y: y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Process each line
  for (const line of lines) {
    // Check if we need a new page
    if (y < margin + lineHeight) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    // Handle headers
    let currentFont = font;
    let currentSize = fontSize;
    let text = line;

    if (line.startsWith("### ")) {
      currentFont = boldFont;
      currentSize = 13;
      text = line.slice(4);
      y -= 5; // Extra spacing before header
    } else if (line.startsWith("## ")) {
      currentFont = boldFont;
      currentSize = 15;
      text = line.slice(3);
      y -= 8;
    } else if (line.startsWith("# ")) {
      currentFont = boldFont;
      currentSize = 17;
      text = line.slice(2);
      y -= 10;
    }

    // Simple text wrapping
    const words = text.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

      if (textWidth > maxWidth && currentLine) {
        // Draw the current line
        currentPage.drawText(currentLine, {
          x: margin,
          y: y,
          size: currentSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;

        // Check for new page
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    // Draw remaining text
    if (currentLine) {
      currentPage.drawText(currentLine, {
        x: margin,
        y: y,
        size: currentSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
    }

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}

/**
 * Export markdown as PDF file (download)
 */
export async function exportAsPdf(
  content: string,
  filename: string
): Promise<void> {
  const title = filename.replace(/\.(md|markdown)$/i, "");
  const blob = await exportAsPdfBlob(content, title);
  const pdfFilename = title + ".pdf";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
