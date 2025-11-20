import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const CDN_WORKER_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_SRC;
}

export interface PDFOutlineNode {
  title: string;
  bold?: boolean;
  italic?: boolean;
  color?: number[];
  dest?: string | unknown[];
  url?: string;
  items?: PDFOutlineNode[];
}

export interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  getOutline: () => Promise<PDFOutlineNode[] | null>;
}

export interface PDFPageProxy {
  getViewport: (params: { scale: number; rotation?: number }) => PDFPageViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }) => PDFRenderTask;
  getTextContent: () => Promise<TextContent>;
}

export interface PDFPageViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export interface PDFRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

export interface TextContent {
  items: TextItem[];
}

export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export async function loadPDFDocument(
  file: File,
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<PDFDocumentProxy> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Suppress console warnings
    });

    // Report progress if callback provided
    if (onProgress) {
      loadingTask.onProgress = onProgress;
    }

    const pdf = await loadingTask.promise;
    return pdf as unknown as PDFDocumentProxy;
  } catch (error: unknown) {
    const { name, message } = (error as { name?: string; message?: string }) ?? {};

    // Provide more descriptive error messages
    if (name === 'InvalidPDFException') {
      throw new Error('Invalid or corrupted PDF file');
    } else if (name === 'MissingPDFException') {
      throw new Error('PDF file not found or empty');
    } else if (name === 'PasswordException') {
      throw new Error('Password-protected PDFs are not supported');
    }

    throw new Error(`Failed to load PDF: ${message || 'Unknown error'}`);
  }
}

export async function searchInPDF(
  pdf: PDFDocumentProxy,
  query: string,
  options?: {
    signal?: AbortSignal;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<Array<{ pageNumber: number; text: string }>> {
  const results: Array<{ pageNumber: number; text: string }> = [];
  const normalizedQuery = query.toLowerCase();

  for (let i = 1; i <= pdf.numPages; i++) {
    // Check for cancellation
    if (options?.signal?.aborted) {
      throw new Error('Search cancelled');
    }

    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (item as TextItem).str)
        .join(' ')
        .toLowerCase();

      if (pageText.includes(normalizedQuery)) {
        // Find the context around the match
        const index = pageText.indexOf(normalizedQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(pageText.length, index + query.length + 50);
        const context = pageText.substring(start, end);

        results.push({
          pageNumber: i,
          text: context,
        });
      }

      // Report progress
      options?.onProgress?.(i, pdf.numPages);
    } catch (error) {
      console.error(`Error searching page ${i}:`, error);
      // Continue with next page
    }
  }

  return results;
}

export function downloadPDF(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPDF(file: File) {
  const url = URL.createObjectURL(file);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 100);
  };
}

