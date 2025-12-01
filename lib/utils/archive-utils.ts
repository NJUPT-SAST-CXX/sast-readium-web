import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { createExtractorFromData } from "node-unrar-js";

export interface ArchiveFile {
  name: string;
  blob: Blob;
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
]);

export async function processArchive(file: File): Promise<File[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".zip") || fileName.endsWith(".cbz")) {
    return processZipArchive(file);
  }

  if (fileName.endsWith(".rar") || fileName.endsWith(".cbr")) {
    return processRarArchive(file);
  }

  throw new Error("Unsupported archive format");
}

async function processZipArchive(file: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(file);
  const pdfFiles: File[] = [];
  const imageEntries: { key: string; getData: () => Promise<ArrayBuffer> }[] =
    [];

  // 1. Scan all files
  for (const key of Object.keys(zip.files)) {
    const entry = zip.files[key];
    if (entry.dir) continue;

    const lowerKey = key.toLowerCase();

    if (lowerKey.endsWith(".pdf")) {
      const blob = await entry.async("blob");
      const extractedFile = new File([blob], key.split("/").pop() ?? key, {
        type: "application/pdf",
      });
      pdfFiles.push(extractedFile);
    } else {
      const ext = "." + lowerKey.split(".").pop();
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageEntries.push({
          key,
          getData: () => entry.async("arraybuffer"),
        });
      }
    }
  }

  // 2. If PDFs found, return them
  if (pdfFiles.length > 0) {
    return pdfFiles;
  }

  // 3. If no PDFs but images found, convert images to PDF
  if (imageEntries.length > 0) {
    try {
      const convertedPdf = await convertImagesToPdf(imageEntries, file.name);
      return [convertedPdf];
    } catch (error) {
      console.error("Failed to convert images to PDF", error);
      return [];
    }
  }

  return [];
}

async function processRarArchive(file: File): Promise<File[]> {
  const buffer = await file.arrayBuffer();
  const extractor = await createExtractorFromData({ data: buffer });

  // Extract all files
  const extracted = extractor.extract();
  const pdfFiles: File[] = [];
  const imageEntries: { key: string; getData: () => Promise<ArrayBuffer> }[] =
    [];

  for (const file of extracted.files) {
    if (file.fileHeader.flags.directory) continue;

    const key = file.fileHeader.name;
    const lowerKey = key.toLowerCase();

    // In node-unrar-js, extraction is usually Uint8Array
    // We wrap it in a function to match our interface
    const getData = async () => {
      if (file.extraction) {
        return file.extraction.buffer as ArrayBuffer;
      }
      return new ArrayBuffer(0);
    };

    if (lowerKey.endsWith(".pdf")) {
      if (file.extraction) {
        const blob = new Blob([file.extraction as unknown as BlobPart], {
          type: "application/pdf",
        });
        const extractedFile = new File([blob], key.split("/").pop() ?? key, {
          type: "application/pdf",
        });
        pdfFiles.push(extractedFile);
      }
    } else {
      const ext = "." + lowerKey.split(".").pop();
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageEntries.push({ key, getData });
      }
    }
  }

  if (pdfFiles.length > 0) {
    return pdfFiles;
  }

  if (imageEntries.length > 0) {
    try {
      const convertedPdf = await convertImagesToPdf(imageEntries, file.name);
      return [convertedPdf];
    } catch (error) {
      console.error("Failed to convert images to PDF", error);
      return [];
    }
  }

  return [];
}

async function convertImagesToPdf(
  entries: { key: string; getData: () => Promise<ArrayBuffer> }[],
  originalFileName: string
): Promise<File> {
  // Sort images by filename naturally
  entries.sort((a, b) => {
    return a.key.localeCompare(b.key, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const pdfDoc = await PDFDocument.create();

  for (const { getData, key } of entries) {
    try {
      const buffer = await getData();
      const lowerKey = key.toLowerCase();

      let image;
      if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
        image = await pdfDoc.embedJpg(buffer);
      } else if (lowerKey.endsWith(".png")) {
        image = await pdfDoc.embedPng(buffer);
      } else {
        // console.warn(`Skipping unsupported image format for PDF conversion: ${key}`);
        continue;
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    } catch (err) {
      console.error(`Failed to process image ${key}`, err);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const newFileName =
    originalFileName.replace(/\.(zip|cbz|rar|cbr)$/i, "") + ".pdf";

  // Fix type error by casting or using Blob
  return new File([pdfBytes as BlobPart], newFileName, {
    type: "application/pdf",
  });
}
