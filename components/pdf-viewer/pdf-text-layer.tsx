'use client';

import { useEffect, useRef } from 'react';
import { PDFPageProxy, TextItem } from '@/lib/pdf-utils';

interface PDFTextLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  searchQuery?: string;
  caseSensitive?: boolean;
}

export function PDFTextLayer({ page, scale, rotation, searchQuery = '', caseSensitive = false }: PDFTextLayerProps) {
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!page || !textLayerRef.current) return;

    const textLayer = textLayerRef.current;
    textLayer.innerHTML = ''; // Clear previous content

    // Create text layer
    page.getTextContent().then((textContent) => {
      textContent.items.forEach((item) => {
        const textItem = item as TextItem;
        const textDiv = document.createElement('div');
        const tx = textItem.transform;
        
        // Calculate position and size
        const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        const fontHeight = fontSize;
        
        textDiv.style.position = 'absolute';
        textDiv.style.left = `${tx[4]}px`;
        textDiv.style.top = `${tx[5] - fontHeight}px`;
        textDiv.style.fontSize = `${fontSize}px`;
        textDiv.style.fontFamily = 'sans-serif';
        textDiv.style.transform = `scaleX(${textItem.width / (fontSize * textItem.str.length)})`;
        textDiv.style.transformOrigin = 'left bottom';
        textDiv.style.whiteSpace = 'pre';
        textDiv.style.opacity = '0.2';
        textDiv.style.pointerEvents = 'none';
        textDiv.textContent = textItem.str;

        // Highlight search results
        if (searchQuery && textItem.str) {
          const searchText = caseSensitive ? searchQuery : searchQuery.toLowerCase();
          const itemText = caseSensitive ? textItem.str : textItem.str.toLowerCase();
          
          if (itemText.includes(searchText)) {
            textDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
            textDiv.style.opacity = '1';
          }
        }

        textLayer.appendChild(textDiv);
      });
    }).catch((error) => {
      console.error('Error rendering text layer:', error);
    });
  }, [page, scale, rotation, searchQuery, caseSensitive]);

  return (
    <div
      ref={textLayerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        overflow: 'hidden',
      }}
    />
  );
}
