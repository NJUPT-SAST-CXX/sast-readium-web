import { memo } from 'react';

interface PDFWatermarkProps {
  text: string;
  color: string;
  opacity: number;
  size: number;
  width: number;
  height: number;
  gapX: number;
  gapY: number;
  rotation: number;
}

const PDFWatermarkComponent = ({
  text,
  color,
  opacity,
  size,
  width,
  height,
  gapX = 1.5,
  gapY = 4,
  rotation = -45,
}: PDFWatermarkProps) => {
  if (!text) return null;

  // Calculate spacing based on text length and size to ensure good coverage
  const spacingX = size * text.length * gapX;
  const spacingY = size * gapY;
  
  // Calculate number of repetitions needed to cover the area
  const cols = Math.ceil(width / spacingX) + 1;
  const rows = Math.ceil(height / spacingY) + 1;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10"
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 flex flex-wrap content-start items-center justify-center"
        style={{
          gap: `${spacingY}px ${spacingX}px`,
          padding: `${spacingY / 2}px`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            className="whitespace-nowrap origin-center flex items-center justify-center"
            style={{
              color: color,
              opacity: opacity,
              fontSize: `${size}px`,
              width: spacingX,
              height: spacingY,
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PDFWatermark = memo(PDFWatermarkComponent);
