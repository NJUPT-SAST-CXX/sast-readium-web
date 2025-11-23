import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Annotation } from './pdf-store';

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
  getDestination: (dest: string) => Promise<unknown[] | null>;
  getPageIndex: (pageRef: unknown) => Promise<number>;
  getMetadata: () => Promise<{ info: Record<string, unknown>; metadata: unknown } | null>;
  destroy: () => Promise<void>;
}

export interface PDFAnnotationData {
  subtype: string;
  rect: number[];
  url?: string;
  dest?: string | unknown[];
  [key: string]: unknown;
}

export interface PDFPageProxy {
  getViewport: (params: { scale: number; rotation?: number }) => PDFPageViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }) => PDFRenderTask;
  getTextContent: () => Promise<TextContent>;
  getAnnotations: () => Promise<PDFAnnotationData[]>;
}

export interface PDFPageViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  transform: number[];
  convertToViewportPoint: (x: number, y: number) => number[];
  convertToPdfPoint: (x: number, y: number) => number[];
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

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();

const getCacheKey = (file: File) => `${file.name}-${file.lastModified}-${file.size}`;

export async function loadPDFDocument(
  file: File,
  onProgress?: (progress: { loaded: number; total: number }) => void,
  password?: string
): Promise<PDFDocumentProxy> {
  const cacheKey = getCacheKey(file) + (password ? `-protected` : '');

  if (documentCache.has(cacheKey)) {
    const cachedPromise = documentCache.get(cacheKey)!;
    if (onProgress) {
      // Simulate 100% progress for cached files
      onProgress({ loaded: file.size, total: file.size });
    }
    return cachedPromise;
  }

  const loadPromise = (async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password,
        verbosity: 0, // Suppress console warnings
      });

      // Report progress if callback provided
      if (onProgress) {
        loadingTask.onProgress = onProgress;
      }

      const pdf = await loadingTask.promise;
      return pdf as unknown as PDFDocumentProxy;
    } catch (error: unknown) {
      documentCache.delete(cacheKey);
      const { name, message } = (error as { name?: string; message?: string }) ?? {};

      // Provide more descriptive error messages
      if (name === 'InvalidPDFException') {
        throw new Error('Invalid or corrupted PDF file');
      } else if (name === 'MissingPDFException') {
        throw new Error('PDF file not found or empty');
      } else if (name === 'PasswordException') {
        // Re-throw password exception so the UI can handle it
        const err = new Error('Password required');
        err.name = 'PasswordException';
        throw err;
      }

      throw new Error(`Failed to load PDF: ${message || 'Unknown error'}`);
    }
  })();

  documentCache.set(cacheKey, loadPromise);
  return loadPromise;
}

export function unloadPDFDocument(file: File) {
  const cacheKey = getCacheKey(file);
  const cachedPromise = documentCache.get(cacheKey);
  
  if (cachedPromise) {
    documentCache.delete(cacheKey);
    cachedPromise.then((pdf) => {
      try {
        pdf.destroy();
      } catch (err) {
        console.error('Error destroying PDF document:', err);
      }
    }).catch(() => {
      // Ignore errors from failed loads
    });
  }
}

export async function searchInPDF(
  pdf: PDFDocumentProxy,
  query: string,
  options?: {
    signal?: AbortSignal;
    onProgress?: (current: number, total: number) => void;
    caseSensitive?: boolean;
  }
): Promise<Array<{ pageNumber: number; text: string }>> {
  const results: Array<{ pageNumber: number; text: string }> = [];
  const normalizedQuery = options?.caseSensitive ? query : query.toLowerCase();

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
        .join(' ');
      
      const searchText = options?.caseSensitive ? pageText : pageText.toLowerCase();

      if (searchText.includes(normalizedQuery)) {
        // Find the context around the match
        const index = searchText.indexOf(normalizedQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(searchText.length, index + query.length + 50);
        const context = searchText.substring(start, end);

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

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function savePDF(
  file: File, 
  annotations: Annotation[],
  options?: {
    pageOrder?: number[];
    pageRotations?: Record<number, number>;
  }
) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Create a new document for saving to handle reordering cleanly
    const newPdfDoc = await PDFDocument.create();
    
    // Determine page order: use provided order or default 1..N
    const pageOrder = options?.pageOrder && options.pageOrder.length > 0
      ? options.pageOrder
      : Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i + 1);

    // Copy pages in order
    // pageOrder indices are 1-based, copyPages expects 0-based
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageOrder.map(p => p - 1));

    for (let i = 0; i < copiedPages.length; i++) {
      const page = copiedPages[i];
      const originalPageNum = pageOrder[i];
      
      // Apply rotation if specified
      if (options?.pageRotations) {
        const rotation = options.pageRotations[originalPageNum] || 0;
        if (rotation !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + rotation) % 360));
        }
      }
      
      newPdfDoc.addPage(page);
    }

    // Get pages from new document to draw annotations on
    const pages = newPdfDoc.getPages();
    
    // Group annotations by page. 
    // Annotation pageNumber is assumed to be the Visual Page Number (1-based) in the viewer.
    // Since newPdfDoc is constructed in Visual Order, annotation.pageNumber maps directly to newPdfDoc page index.
    const annotationsByPage = annotations.reduce((acc, annotation) => {
      if (!acc[annotation.pageNumber]) {
        acc[annotation.pageNumber] = [];
      }
      acc[annotation.pageNumber].push(annotation);
      return acc;
    }, {} as Record<number, Annotation[]>);

    for (const [pageNumber, pageAnnotations] of Object.entries(annotationsByPage)) {
      const pageIndex = parseInt(pageNumber) - 1;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        for (const annotation of pageAnnotations) {
          const color = hexToRgb(annotation.color);
          // Normalized coordinates (0-1) -> PDF coordinates
          const x = annotation.position.x * width;
          // PDF y is from bottom, UI y is from top
          const y = height - (annotation.position.y * height);

          if (annotation.type === 'highlight') {
            const w = (annotation.position.width || 0) * width;
            const h = (annotation.position.height || 0) * height;
            
            page.drawRectangle({
              x,
              y: y - h, 
              width: w,
              height: h,
              color,
              opacity: 0.4,
            });
          } else if (annotation.type === 'text' || annotation.type === 'comment') {
             if (annotation.content) {
               // Simple text rendering
               page.drawText(annotation.content, {
                 x,
                 y: y - 12, 
                 size: 12,
                 font: helveticaFont,
                 color,
               });
             }
          } else if (annotation.type === 'shape') {
            const w = (annotation.position.width || 0) * width;
            const h = (annotation.position.height || 0) * height;
            
            page.drawRectangle({
              x,
              y: y - h,
              width: w,
              height: h,
              borderColor: color,
              borderWidth: 2,
              opacity: 0,
            });
          } else if (annotation.type === 'drawing' && annotation.path) {
             // Draw path
             // path is array of {x, y} in normalized coords
             if (annotation.path.length > 1) {
               const pathPoints = annotation.path.map(p => ({
                 x: p.x * width,
                 y: height - (p.y * height)
               }));
               
               for (let i = 0; i < pathPoints.length - 1; i++) {
                 const p1 = pathPoints[i];
                 const p2 = pathPoints[i+1];
                 page.drawLine({
                   start: p1,
                   end: p2,
                   thickness: annotation.strokeWidth || 2,
                   color,
                 });
               }
             }
          } else if (annotation.type === 'image' && annotation.content) {
            try {
              // Check if content is a data URL
              const isDataUrl = annotation.content.startsWith('data:image/');
              if (isDataUrl) {
                let image;
                if (annotation.content.startsWith('data:image/png')) {
                  image = await newPdfDoc.embedPng(annotation.content);
                } else if (annotation.content.startsWith('data:image/jpeg') || annotation.content.startsWith('data:image/jpg')) {
                  image = await newPdfDoc.embedJpg(annotation.content);
                }

                if (image) {
                  const w = (annotation.position.width || 0) * width;
                  const h = (annotation.position.height || 0) * height;
                  
                  page.drawImage(image, {
                    x,
                    y: y - h, // PDF y is bottom-left, so subtract height to get top-left of image
                    width: w,
                    height: h,
                  });
                }
              }
            } catch (embedErr) {
              console.error('Failed to embed image annotation:', embedErr);
            }
          }
        }
      }
    }

    const pdfBytes = await newPdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace('.pdf', '-annotated.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error saving PDF:', err);
    alert('Failed to save PDF with annotations. Downloading original instead.');
    downloadPDF(file);
  }
}

export interface PDFMetadataUpdate {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export async function updatePDFMetadata(file: File, metadata: PDFMetadataUpdate): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);
  if (metadata.creationDate !== undefined) pdfDoc.setCreationDate(metadata.creationDate);
  if (metadata.modificationDate !== undefined) pdfDoc.setModificationDate(metadata.modificationDate);
  else pdfDoc.setModificationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes as unknown as BlobPart], file.name, { type: 'application/pdf', lastModified: Date.now() });
}

