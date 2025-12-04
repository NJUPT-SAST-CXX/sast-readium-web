/**
 * PPTX Exporter - Export presentations to PowerPoint format
 *
 * Uses pptxgenjs library to generate PPTX files.
 */

import pptxgen from "pptxgenjs";
import type {
  Presentation,
  Slide,
  SlideElement,
  PresentationTheme,
  SlideLayout,
} from "../types";

// ============================================================================
// Types
// ============================================================================

interface ExportOptions {
  includeNotes?: boolean;
  quality?: "draft" | "normal" | "high";
}

interface ExportResult {
  blob: Blob;
  fileName: string;
}

// ============================================================================
// Constants
// ============================================================================

// Standard 16:9 slide dimensions in inches
const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.625;

// Conversion factor from pixels to inches (assuming 96 DPI design)
const CANVAS_WIDTH = 960;
// const CANVAS_HEIGHT = 540; // Reserved for aspect ratio calculations
const PX_TO_INCH = SLIDE_WIDTH / CANVAS_WIDTH;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert pixel position to inches
 */
function pxToInches(px: number): number {
  return px * PX_TO_INCH;
}

/**
 * Convert hex color to PPTX format (remove #)
 */
function formatColor(color: string): string {
  return color.replace("#", "");
}

/**
 * Get font weight as PPTX boolean
 */
function isBold(fontWeight?: string): boolean {
  return fontWeight === "bold" || fontWeight === "700";
}

/**
 * Map text alignment to PPTX alignment
 */
function mapAlignment(align?: string): "left" | "center" | "right" {
  switch (align) {
    case "center":
      return "center";
    case "right":
      return "right";
    default:
      return "left";
  }
}

// ============================================================================
// Element Exporters
// ============================================================================

/**
 * Export text element to PPTX slide
 */
function exportTextElement(
  pptSlide: pptxgen.Slide,
  element: SlideElement,
  theme: PresentationTheme
): void {
  const options: pptxgen.TextPropsOptions = {
    x: pxToInches(element.position.x),
    y: pxToInches(element.position.y),
    w: pxToInches(element.size.width),
    h: pxToInches(element.size.height),
    fontSize: element.style.fontSize || theme.bodyFontSize,
    fontFace: theme.fontFamily.split(",")[0].trim(),
    color: formatColor(element.style.color || theme.primaryColor),
    bold: isBold(element.style.fontWeight),
    italic: element.style.fontStyle === "italic",
    align: mapAlignment(element.style.textAlign),
    valign: "middle",
  };

  // Add background if specified
  if (element.style.backgroundColor) {
    options.fill = { color: formatColor(element.style.backgroundColor) };
  }

  pptSlide.addText(element.content, options);
}

/**
 * Export image element to PPTX slide
 */
function exportImageElement(
  pptSlide: pptxgen.Slide,
  element: SlideElement
): void {
  // Check if content is base64 data URL
  const isBase64 = element.content.startsWith("data:");

  const options: pptxgen.ImageProps = {
    x: pxToInches(element.position.x),
    y: pxToInches(element.position.y),
    w: pxToInches(element.size.width),
    h: pxToInches(element.size.height),
  };

  if (isBase64) {
    options.data = element.content;
  } else {
    options.path = element.content;
  }

  // Add border radius as rounding if specified
  if (element.style.borderRadius && element.style.borderRadius > 0) {
    options.rounding = true;
  }

  pptSlide.addImage(options);
}

/**
 * Export shape element to PPTX slide
 */
function exportShapeElement(
  pptSlide: pptxgen.Slide,
  element: SlideElement,
  theme: PresentationTheme
): void {
  // Determine shape type from content or default to rectangle
  // pptxgenjs uses string literals for shape types
  let shapeType = "rect" as const;

  const content = element.content.toLowerCase();
  if (content.includes("circle") || content.includes("ellipse")) {
    // Use rectangle as fallback since ellipse may not be a valid type
    shapeType = "rect" as const;
  } else if (content.includes("arrow")) {
    shapeType = "rect" as const;
  } else if (content.includes("line")) {
    shapeType = "rect" as const;
  }

  const options: pptxgen.ShapeProps = {
    x: pxToInches(element.position.x),
    y: pxToInches(element.position.y),
    w: pxToInches(element.size.width),
    h: pxToInches(element.size.height),
  };

  // Fill
  if (element.style.backgroundColor) {
    options.fill = { color: formatColor(element.style.backgroundColor) };
  } else {
    options.fill = { color: formatColor(theme.secondaryColor) };
  }

  // Border
  if (element.style.borderColor && element.style.borderWidth) {
    options.line = {
      color: formatColor(element.style.borderColor),
      width: element.style.borderWidth,
    };
  }

  pptSlide.addShape(shapeType, options);
}

// ============================================================================
// Slide Layout Handlers
// ============================================================================

/**
 * Apply layout-specific elements
 */
function applySlideLayout(
  pptSlide: pptxgen.Slide,
  slide: Slide,
  theme: PresentationTheme
): void {
  // Add slide title as separate text if not already in elements
  const hasTitleElement = slide.elements.some(
    (el) =>
      el.type === "text" &&
      el.style.fontSize &&
      el.style.fontSize >= theme.titleFontSize - 4
  );

  if (!hasTitleElement && slide.title && slide.layout !== "blank") {
    const titleY = slide.layout === "title" ? 2 : 0.3;
    const titleFontSize =
      slide.layout === "title" ? theme.titleFontSize + 8 : theme.titleFontSize;

    pptSlide.addText(slide.title, {
      x: 0.5,
      y: titleY,
      w: SLIDE_WIDTH - 1,
      h: 0.8,
      fontSize: titleFontSize,
      fontFace: theme.fontFamily.split(",")[0].trim(),
      color: formatColor(theme.primaryColor),
      bold: true,
      align: slide.layout === "title" ? "center" : "left",
    });
  }
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export presentation to PPTX format
 */
export async function exportToPPTX(
  presentation: Presentation,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { includeNotes = true } = options;

  // Create new presentation
  const pptx = new pptxgen();

  // Set presentation metadata
  pptx.title = presentation.title;
  pptx.author = "SAST Readium";
  pptx.subject = presentation.sourceFileName
    ? `Generated from ${presentation.sourceFileName}`
    : "AI Generated Presentation";

  // Set slide size to 16:9
  pptx.defineLayout({
    name: "CUSTOM",
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
  });
  pptx.layout = "CUSTOM";

  // Process each slide
  for (const slide of presentation.slides) {
    const pptSlide = pptx.addSlide();

    // Set slide background
    if (slide.backgroundColor) {
      pptSlide.background = { color: formatColor(slide.backgroundColor) };
    } else if (presentation.theme.backgroundColor) {
      pptSlide.background = {
        color: formatColor(presentation.theme.backgroundColor),
      };
    }

    // Apply layout-specific elements
    applySlideLayout(pptSlide, slide, presentation.theme);

    // Export each element
    for (const element of slide.elements) {
      try {
        switch (element.type) {
          case "text":
            exportTextElement(pptSlide, element, presentation.theme);
            break;
          case "image":
            exportImageElement(pptSlide, element);
            break;
          case "shape":
            exportShapeElement(pptSlide, element, presentation.theme);
            break;
          // Chart elements would need additional handling
          default:
            console.warn(`Unknown element type: ${element.type}`);
        }
      } catch (error) {
        console.error(`Error exporting element ${element.id}:`, error);
      }
    }

    // Add speaker notes
    if (includeNotes && slide.notes) {
      pptSlide.addNotes(slide.notes);
    }
  }

  // Generate the file
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;

  // Generate filename
  const sanitizedTitle = presentation.title
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")
    .slice(0, 50);
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizedTitle}_${timestamp}.pptx`;

  return { blob, fileName };
}

/**
 * Download presentation as PPTX file
 */
export async function downloadPPTX(
  presentation: Presentation,
  options: ExportOptions = {}
): Promise<void> {
  const { blob, fileName } = await exportToPPTX(presentation, options);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Template Generation
// ============================================================================

// Reserved for future template-based slide generation
// interface SlideTemplate {
//   layout: SlideLayout;
//   elements: Array<Omit<SlideElement, "id">>;
// }

/**
 * Generate slide elements from AI-generated content
 */
export function generateSlideFromContent(
  title: string,
  bullets: string[],
  layout: SlideLayout,
  theme: PresentationTheme,
  options: {
    visualSuggestion?: string;
    notes?: string;
  } = {}
): Omit<Slide, "id" | "order"> {
  const elements: Array<Omit<SlideElement, "id">> = [];

  switch (layout) {
    case "title":
      // Center title
      elements.push({
        type: "text",
        content: title,
        position: { x: 50, y: 180 },
        size: { width: 860, height: 100 },
        style: {
          fontSize: theme.titleFontSize + 8,
          fontWeight: "bold",
          textAlign: "center",
          color: theme.primaryColor,
        },
        zIndex: 1,
      });

      // Subtitle from first bullet if exists
      if (bullets.length > 0) {
        elements.push({
          type: "text",
          content: bullets[0],
          position: { x: 100, y: 300 },
          size: { width: 760, height: 60 },
          style: {
            fontSize: theme.bodyFontSize + 4,
            textAlign: "center",
            color: theme.secondaryColor,
          },
          zIndex: 2,
        });
      }
      break;

    case "content":
      // Title at top
      elements.push({
        type: "text",
        content: title,
        position: { x: 40, y: 30 },
        size: { width: 880, height: 60 },
        style: {
          fontSize: theme.titleFontSize,
          fontWeight: "bold",
          color: theme.primaryColor,
        },
        zIndex: 1,
      });

      // Bullets as content
      const bulletText = bullets.map((b) => `• ${b}`).join("\n");
      elements.push({
        type: "text",
        content: bulletText,
        position: { x: 40, y: 110 },
        size: { width: 880, height: 380 },
        style: {
          fontSize: theme.bodyFontSize,
          color: theme.primaryColor,
        },
        zIndex: 2,
      });
      break;

    case "two-column":
      // Title
      elements.push({
        type: "text",
        content: title,
        position: { x: 40, y: 30 },
        size: { width: 880, height: 60 },
        style: {
          fontSize: theme.titleFontSize,
          fontWeight: "bold",
          color: theme.primaryColor,
        },
        zIndex: 1,
      });

      // Split bullets into two columns
      const midpoint = Math.ceil(bullets.length / 2);
      const leftBullets = bullets.slice(0, midpoint);
      const rightBullets = bullets.slice(midpoint);

      elements.push({
        type: "text",
        content: leftBullets.map((b) => `• ${b}`).join("\n"),
        position: { x: 40, y: 110 },
        size: { width: 420, height: 380 },
        style: {
          fontSize: theme.bodyFontSize,
          color: theme.primaryColor,
        },
        zIndex: 2,
      });

      elements.push({
        type: "text",
        content: rightBullets.map((b) => `• ${b}`).join("\n"),
        position: { x: 500, y: 110 },
        size: { width: 420, height: 380 },
        style: {
          fontSize: theme.bodyFontSize,
          color: theme.primaryColor,
        },
        zIndex: 3,
      });
      break;

    case "image-focus":
      // Title at top
      elements.push({
        type: "text",
        content: title,
        position: { x: 40, y: 30 },
        size: { width: 880, height: 50 },
        style: {
          fontSize: theme.titleFontSize - 4,
          fontWeight: "bold",
          color: theme.primaryColor,
        },
        zIndex: 1,
      });

      // Placeholder for image
      elements.push({
        type: "shape",
        content: "rectangle",
        position: { x: 300, y: 100 },
        size: { width: 360, height: 270 },
        style: {
          backgroundColor: "#e5e7eb",
          borderColor: "#9ca3af",
          borderWidth: 1,
        },
        zIndex: 2,
      });

      // Caption/bullets below
      if (bullets.length > 0) {
        elements.push({
          type: "text",
          content: bullets[0],
          position: { x: 100, y: 400 },
          size: { width: 760, height: 100 },
          style: {
            fontSize: theme.bodyFontSize - 2,
            textAlign: "center",
            color: theme.secondaryColor,
          },
          zIndex: 3,
        });
      }
      break;

    default: // blank
      elements.push({
        type: "text",
        content: title,
        position: { x: 40, y: 30 },
        size: { width: 880, height: 60 },
        style: {
          fontSize: theme.titleFontSize,
          fontWeight: "bold",
          color: theme.primaryColor,
        },
        zIndex: 1,
      });
  }

  return {
    title,
    elements: elements.map((el, index) => ({
      ...el,
      id: `temp-${index}`,
    })) as SlideElement[],
    notes: options.notes || "",
    layout,
  };
}

/**
 * Create a complete presentation from AI-generated content
 */
export function createPresentationFromContent(
  title: string,
  slides: Array<{
    title: string;
    bullets: string[];
    layout?: SlideLayout;
    notes?: string;
    visualSuggestion?: string;
  }>,
  theme: PresentationTheme,
  sourceDoc?: { id: string; name: string }
): Omit<Presentation, "id" | "createdAt" | "updatedAt"> {
  const generatedSlides: Array<Omit<Slide, "id">> = slides.map(
    (slideContent, index) => {
      const layout = slideContent.layout || (index === 0 ? "title" : "content");
      const slide = generateSlideFromContent(
        slideContent.title,
        slideContent.bullets,
        layout,
        theme,
        {
          notes: slideContent.notes,
          visualSuggestion: slideContent.visualSuggestion,
        }
      );
      return {
        ...slide,
        order: index,
      };
    }
  );

  return {
    title,
    slides: generatedSlides.map((slide, index) => ({
      ...slide,
      id: `slide-${index}`,
    })) as Slide[],
    theme,
    sourceDocumentId: sourceDoc?.id,
    sourceFileName: sourceDoc?.name,
  };
}
