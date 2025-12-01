/**
 * Document type utilities for supporting multiple file formats
 */

export type DocumentType = "pdf" | "markdown" | "unknown";

/**
 * Markdown file extensions (lowercase)
 */
const MARKDOWN_EXTENSIONS = [
  ".md",
  ".markdown",
  ".mdown",
  ".mkdn",
  ".mkd",
  ".mdwn",
  ".mdtxt",
  ".mdtext",
];

/**
 * Markdown MIME types
 */
const MARKDOWN_MIME_TYPES = ["text/markdown", "text/x-markdown", "text/plain"];

/**
 * Detect document type from a File object
 */
export function getDocumentType(file: File): DocumentType {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check for PDF
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  // Check for Markdown
  if (
    MARKDOWN_MIME_TYPES.includes(mimeType) ||
    MARKDOWN_EXTENSIONS.some((ext) => fileName.endsWith(ext))
  ) {
    return "markdown";
  }

  return "unknown";
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return getDocumentType(file) === "pdf";
}

/**
 * Check if a file is a Markdown file
 */
export function isMarkdown(file: File): boolean {
  return getDocumentType(file) === "markdown";
}

/**
 * Check if a file is a supported document type
 */
export function isSupportedDocument(file: File): boolean {
  const type = getDocumentType(file);
  return type === "pdf" || type === "markdown";
}

/**
 * Get file accept string for file input
 */
export function getAcceptString(): string {
  return [
    "application/pdf",
    ".pdf",
    "text/markdown",
    "text/x-markdown",
    ...MARKDOWN_EXTENSIONS,
  ].join(",");
}

/**
 * Get human-readable document type name
 */
export function getDocumentTypeName(type: DocumentType): string {
  switch (type) {
    case "pdf":
      return "PDF";
    case "markdown":
      return "Markdown";
    default:
      return "Unknown";
  }
}

/**
 * Read markdown file content as text
 */
export async function readMarkdownContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
