'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFPageProxy, TextItem } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { Copy, Highlighter, X } from 'lucide-react';
import { usePDFStore } from '@/lib/pdf-store';

interface PDFTextLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  searchQuery?: string;
  caseSensitive?: boolean;
  pageNumber?: number;
}

export function PDFTextLayer({ page, scale, rotation, searchQuery = '', caseSensitive = false, pageNumber }: PDFTextLayerProps) {
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const { addAnnotation } = usePDFStore();

  useEffect(() => {
    if (!page || !textLayerRef.current) return;

    const textLayer = textLayerRef.current;
    textLayer.innerHTML = ''; // Clear previous content

    // Create text layer
    page.getTextContent().then((textContent) => {
      const viewport = page.getViewport({ scale, rotation });
      
      // Set dimensions to match viewport
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      textContent.items.forEach((item) => {
        const textItem = item as TextItem;
        const textDiv = document.createElement('div');
        const tx = textItem.transform;
        
        // Calculate PDF font size (unscaled)
        const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        
        // Calculate Viewport coordinates using the transform matrix
        // viewport.transform is [sx, ky, kx, sy, tx, ty]
        const [sx, ky, kx, sy, tx_v, ty_v] = viewport.transform;
        
        const x_pdf = tx[4];
        const y_pdf = tx[5];
        
        // Transform PDF point to viewport point
        const vx = x_pdf * sx + y_pdf * kx + tx_v;
        const vy = x_pdf * ky + y_pdf * sy + ty_v;
        
        const scaledFontSize = fontSize * scale;
        
        textDiv.style.position = 'absolute';
        textDiv.style.left = `${vx}px`;
        textDiv.style.top = `${vy - scaledFontSize}px`;
        textDiv.style.fontSize = `${scaledFontSize}px`;
        textDiv.style.fontFamily = 'sans-serif';
        // Calculate width scaling to match PDF text width
        // textItem.width is in PDF units, needs to be scaled by viewport scale
        // But the container font size is already scaled, so the ratio uses unscaled values
        textDiv.style.transform = `scaleX(${textItem.width / (fontSize * textItem.str.length)})`;
        textDiv.style.transformOrigin = 'left bottom';
        textDiv.style.whiteSpace = 'pre';
        textDiv.style.color = 'transparent';
        textDiv.style.cursor = 'text';
        textDiv.style.userSelect = 'text';
        textDiv.style.pointerEvents = 'auto';
        textDiv.className = 'pdf-text-item';
        textDiv.textContent = textItem.str;

        // Highlight search results
        if (searchQuery && textItem.str) {
          const searchText = caseSensitive ? searchQuery : searchQuery.toLowerCase();
          const itemText = caseSensitive ? textItem.str : textItem.str.toLowerCase();
          
          if (itemText.includes(searchText)) {
            textDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
          }
        }

        textLayer.appendChild(textDiv);
      });
    }).catch((error) => {
      console.error('Error rendering text layer:', error);
    });
  }, [page, scale, rotation, searchQuery, caseSensitive]);

  // Handle selection
  useEffect(() => {
    const element = textLayerRef.current;
    if (!element) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionMenu(null);
        return;
      }

      // Check if selection is inside this text layer
      if (!element.contains(selection.anchorNode) && !element.contains(selection.focusNode)) {
        return;
      }

      const text = getSelectedText(selection);
      if (!text.trim()) {
        setSelectionMenu(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const bounds = range.getBoundingClientRect();
      const layerRect = element.getBoundingClientRect();

      // Position menu centered above selection
      const x = bounds.left - layerRect.left + (bounds.width / 2);
      const y = bounds.top - layerRect.top;

      setSelectionMenu({ x, y, text });
    };

    const handleMouseDown = () => {
      setSelectionMenu(null);
    };

    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [page]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMenu) {
      navigator.clipboard.writeText(selectionMenu.text);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleHighlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMenu && textLayerRef.current && pageNumber && page) {
      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);
      const bounds = range.getBoundingClientRect();
      const layerRect = textLayerRef.current.getBoundingClientRect();

      // Calculate relative coordinates (0-1)
      const relativeX = (bounds.left - layerRect.left) / layerRect.width;
      const relativeY = (bounds.top - layerRect.top) / layerRect.height;
      const relativeWidth = bounds.width / layerRect.width;
      const relativeHeight = bounds.height / layerRect.height;

      addAnnotation({
        type: 'highlight',
        pageNumber,
        color: '#ffff00',
        position: {
          x: relativeX,
          y: relativeY,
          width: relativeWidth,
          height: relativeHeight,
        },
        content: selectionMenu.text, // Store selected text as content
      });

      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <>
      <div
        ref={textLayerRef}
        className="absolute inset-0 cursor-text"
        style={{
          overflow: 'hidden',
          userSelect: 'text',
          pointerEvents: 'auto',
        }}
      />
      
      {/* Selection Menu */}
      {selectionMenu && (
        <div
          className="absolute z-50 flex items-center gap-1 rounded-md bg-popover p-1 shadow-md border border-border animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y - 40}px`, // 40px above selection
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent clearing selection
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleHighlight}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-[1px] bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => {
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}

function getSelectedText(selection: Selection): string {
  if (selection.rangeCount === 0) return '';
  const range = selection.getRangeAt(0);
  
  // Get all text items in the document (visible pages)
  const items = Array.from(document.querySelectorAll('.pdf-text-item')) as HTMLElement[];
  const selectedItems: { text: string, top: number, left: number, right: number, height: number, fontSize: number }[] = [];

  items.forEach(item => {
    if (selection.containsNode(item, true)) {
       const rect = item.getBoundingClientRect();
       
       let text = item.textContent || '';
       
       // Handle partial selection
       const textNode = item.firstChild;
       if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          let start = 0;
          let end = text.length;
          
          if (range.startContainer === textNode) {
            start = range.startOffset;
          }
          if (range.endContainer === textNode) {
            end = range.endOffset;
          }
          
          // Check if the node is intersected by the range
          if (!range.intersectsNode(item)) return;
          
          text = text.substring(start, end);
       }
       
       if (text) {
           selectedItems.push({
             text,
             top: rect.top,
             left: rect.left,
             right: rect.right,
             height: rect.height,
             fontSize: parseFloat(item.style.fontSize || '0') || rect.height
           });
       }
    }
  });

  // Sort items
  selectedItems.sort((a, b) => {
     const midA = a.top + a.height/2;
     const midB = b.top + b.height/2;
     // Same line threshold: half height of smaller item
     if (Math.abs(midA - midB) < (Math.min(a.height, b.height) / 2)) {
         return a.left - b.left;
     }
     return a.top - b.top;
  });

  // Join text
  let result = '';
  for (let i = 0; i < selectedItems.length; i++) {
     const curr = selectedItems[i];
     if (i === 0) {
        result += curr.text;
        continue;
     }
     const prev = selectedItems[i-1];
     
     const midCurr = curr.top + curr.height/2;
     const midPrev = prev.top + prev.height/2;
     
     // Newline check
     if (Math.abs(midCurr - midPrev) > Math.min(curr.height, prev.height) / 2) {
        result += '\n' + curr.text;
     } else {
        // Space check
        const dist = curr.left - prev.right;
        // 20% of font size tolerance for space
        if (dist > (curr.fontSize * 0.2)) { 
            result += ' ' + curr.text;
        } else {
            result += curr.text;
        }
     }
  }
  return result;
}
