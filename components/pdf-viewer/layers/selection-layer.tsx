import React, { useState, useRef } from "react";
import { PDFPageProxy, TextItem } from "@/lib/pdf";
import { usePDFStore } from "@/lib/pdf";
import { useAIChatStore } from "@/lib/ai/core";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PDFSelectionLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  pageNumber: number;
}

interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function PDFSelectionLayer({
  page,
  scale,
  rotation,
  pageNumber,
}: PDFSelectionLayerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const { isSelectionMode, toggleSelectionMode } = usePDFStore();
  const { updatePDFContext, setSidebarOpen } = useAIChatStore();
  const [showMenu, setShowMenu] = useState(false);

  if (!page || !isSelectionMode) return null;

  const getRect = () => {
    if (!selection) return null;
    const left = Math.min(selection.startX, selection.endX);
    const top = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);
    return { left, top, width, height };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showMenu) {
      // If clicking outside menu, clear selection
      if (!(e.target as HTMLElement).closest(".selection-menu")) {
        setSelection(null);
        setShowMenu(false);
      }
      return;
    }

    e.preventDefault(); // Prevent text selection
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelection({ startX: x, startY: y, endX: x, endY: y });
    setShowMenu(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selection || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setSelection({ ...selection, endX: x, endY: y });
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      if (
        selection &&
        (Math.abs(selection.endX - selection.startX) > 5 ||
          Math.abs(selection.endY - selection.startY) > 5)
      ) {
        setShowMenu(true);
      } else {
        setSelection(null);
      }
    }
  };

  const getCanvas = () => {
    // Assuming PDFPage renders a canvas sibling or parent
    // In structure: div (relative) -> PDFPage (div -> canvas)
    // PDFSelectionLayer is sibling of PDFPage
    // We need to find the canvas in the parent container
    return containerRef.current?.parentElement?.querySelector(
      "canvas"
    ) as HTMLCanvasElement | null;
  };

  const handleCopyImage = async () => {
    const rect = getRect();
    const canvas = getCanvas();
    if (!rect || !canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Draw cropped area
    // We need to map screen coords to canvas coords?
    // PDFPage canvas size might scale.
    // Usually canvas.width = viewport.width * devicePixelRatio
    // But displayed size matches our container size.
    // So canvas coordinates map 1:1 to displayed size IF we consider the displayed size.
    // Wait, canvas.width is the internal resolution.
    // canvas.clientWidth is the displayed size.
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;

    ctx.drawImage(
      canvas,
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      rect.width,
      rect.height
    );

    try {
      tempCanvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          // Show success toast/notification?
          setSelection(null);
          setShowMenu(false);
          toggleSelectionMode(); // Exit mode
        }
      });
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const handleSaveImage = () => {
    const rect = getRect();
    const canvas = getCanvas();
    if (!rect || !canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;

    ctx.drawImage(
      canvas,
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      rect.width,
      rect.height
    );

    const url = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `pdf-selection-page-${pageNumber}.png`;
    link.click();

    setSelection(null);
    setShowMenu(false);
    toggleSelectionMode();
  };

  const handleExtractText = async () => {
    const rect = getRect();
    if (!rect || !page) return;

    try {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale, rotation });

      // Map items to selection
      // items[i].transform is [scaleX, skewY, skewX, scaleY, tx, ty]
      // In standard PDF coords, (0,0) is bottom-left?
      // viewport.convertToViewportPoint maps PDF (x,y) to Viewport (x,y).

      const selectedText = textContent.items
        .filter((item: TextItem) => {
          if (!item.transform) return false;
          const tx = item.transform[4];
          const ty = item.transform[5];

          // Convert PDF point to viewport point
          // PDF coordinates: y grows UP. Viewport: y grows DOWN.
          // viewport.convertToViewportPoint(x, y) handles this.
          const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

          // Check if point is inside rect
          // Note: item coordinates are usually the baseline start.
          // Ideally we check bounding box, but point check is a start.
          return (
            vx >= rect.left &&
            vx <= rect.left + rect.width &&
            vy >= rect.top &&
            vy <= rect.top + rect.height
          );
        })
        .map((item: TextItem) => item.str)
        .join(" ");

      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
        // Sync to AI context
        updatePDFContext({ selectedText });
        alert(
          t("selection.text_copied", {
            preview:
              selectedText.substring(0, 50) +
              (selectedText.length > 50 ? "..." : ""),
          })
        );
        setSelection(null);
        setShowMenu(false);
        toggleSelectionMode();
      } else {
        alert(t("selection.no_text"));
      }
    } catch (err) {
      console.error("Failed to extract text:", err);
    }
  };

  const handleSendToAI = async () => {
    const rect = getRect();
    if (!rect || !page) return;

    try {
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale, rotation });

      const selectedText = textContent.items
        .filter((item: TextItem) => {
          if (!item.transform) return false;
          const tx = item.transform[4];
          const ty = item.transform[5];
          const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
          return (
            vx >= rect.left &&
            vx <= rect.left + rect.width &&
            vy >= rect.top &&
            vy <= rect.top + rect.height
          );
        })
        .map((item: TextItem) => item.str)
        .join(" ");

      if (selectedText) {
        // Sync to AI context and open sidebar
        updatePDFContext({ selectedText });
        setSidebarOpen(true);
        setSelection(null);
        setShowMenu(false);
        toggleSelectionMode();
      } else {
        // If no text, try to capture image and send
        const canvas = getCanvas();
        if (canvas) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = rect.width;
          tempCanvas.height = rect.height;
          const ctx = tempCanvas.getContext("2d");
          if (ctx) {
            const scaleX = canvas.width / canvas.clientWidth;
            const scaleY = canvas.height / canvas.clientHeight;
            ctx.drawImage(
              canvas,
              rect.left * scaleX,
              rect.top * scaleY,
              rect.width * scaleX,
              rect.height * scaleY,
              0,
              0,
              rect.width,
              rect.height
            );
            const dataUrl = tempCanvas.toDataURL("image/png");
            updatePDFContext({
              pageImages: [
                {
                  dataUrl,
                  width: rect.width,
                  height: rect.height,
                  pageNumber,
                },
              ],
            });
            setSidebarOpen(true);
          }
        }
        setSelection(null);
        setShowMenu(false);
        toggleSelectionMode();
      }
    } catch (err) {
      console.error("Failed to send to AI:", err);
    }
  };

  const rect = getRect();

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-50 cursor-crosshair touch-none",
        isSelecting ? "pointer-events-auto" : "pointer-events-auto"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Overlay to dim the rest */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Selection Box */}
      {rect && (
        <div
          className="absolute border-2 border-primary bg-primary/20"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        >
          {/* Menu */}
          {showMenu && (
            <div
              className="selection-menu absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 p-1 bg-background border border-border rounded-md shadow-lg whitespace-nowrap z-50"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyImage}
                title="Copy Image"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSaveImage}
                title="Save Image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExtractText}
                title={t("selection.extract_text")}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
                onClick={handleSendToAI}
                title={t("selection.send_to_ai")}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setSelection(null)}
                title={t("selection.cancel")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
