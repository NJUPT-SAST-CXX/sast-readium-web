'use client';

import { useRef, useState, useEffect } from 'react';
import { usePDFStore, Annotation } from '@/lib/pdf-store';
import { PDFPageProxy } from '@/lib/pdf-utils';
import { X, MessageSquare, GripHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFAnnotationLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  selectedAnnotationType: 'highlight' | 'comment' | 'shape' | 'text' | 'drawing' | null;
  onNavigate?: (dest: string | unknown[]) => void;
}

interface AnnotationInput {
  type: 'comment' | 'text';
  x: number;
  y: number;
}

/**
 * Draggable annotation detail popup
 * Only the header can be used to drag the popup, content area clicks are ignored
 */
interface DraggableAnnotationPopupProps {
  annotation: Annotation;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (content: string) => void;
}

function DraggableAnnotationPopup({
  annotation,
  position: initialPosition,
  onClose,
  onDelete,
  onUpdate,
}: DraggableAnnotationPopupProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(annotation.content || '');
  const dragStartPos = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle drag start - only when clicking on the header
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking directly on the header area
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.stopPropagation();
  };

  // Handle drag movement
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add event listeners to document for smooth dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-background rounded-lg shadow-lg border border-border min-w-[280px] max-w-[400px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside popup from propagating
    >
      {/* Draggable Header - Only this area can be used to drag */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted rounded-t-lg cursor-grab active:cursor-grabbing border-b border-border"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">
            {annotation.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close button
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area - Clicks here do NOT drag the popup */}
      <div className="p-3 space-y-3">
        {/* Annotation Content */}
        {annotation.content && (
          <div>
            {isEditing ? (
              <Input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  } else if (e.key === 'Escape') {
                    setEditValue(annotation.content || '');
                    setIsEditing(false);
                  }
                }}
                className="w-full text-sm"
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-foreground cursor-text"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
              >
                {annotation.content}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Page {annotation.pageNumber}</span>
          <span>•</span>
          <span>{new Date(annotation.timestamp).toLocaleDateString()}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditValue(annotation.content || '');
                  setIsEditing(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {annotation.content && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PDFAnnotationLayer({
  page,
  scale,
  rotation,
  selectedAnnotationType,
  onNavigate,
}: PDFAnnotationLayerProps) {
  const { annotations, addAnnotation, removeAnnotation, updateAnnotation, currentPage } = usePDFStore();
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [annotationInput, setAnnotationInput] = useState<AnnotationInput | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<{
    annotation: Annotation;
    x: number;
    y: number;
  } | null>(null);
  const [nativeAnnotations, setNativeAnnotations] = useState<any[]>([]);

  useEffect(() => {
    if (!page) {
      setNativeAnnotations([]);
      return;
    }
    
    let mounted = true;
    page.getAnnotations().then((annots) => {
      if (mounted) setNativeAnnotations(annots);
    }).catch(err => console.error('Error loading annotations:', err));

    return () => { mounted = false; };
  }, [page]);

  // Filter annotations for current page
  const currentPageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // Get viewport dimensions
  const viewport = page?.getViewport({ scale, rotation });

  const getNativeAnnotationStyle = (rect: number[]) => {
    if (!viewport) return {};
    const [x1, y1, x2, y2] = rect;
    // viewport.convertToViewportPoint handles the coordinate transform including rotation
    // Note: PDF coordinates are usually bottom-left origin, but convertToViewportPoint expects PDF coordinates
    const p1 = viewport.convertToViewportPoint(x1, y1);
    const p2 = viewport.convertToViewportPoint(x2, y2);
    
    const minX = Math.min(p1[0], p2[0]);
    const minY = Math.min(p1[1], p2[1]);
    const maxX = Math.max(p1[0], p2[0]);
    const maxY = Math.max(p1[1], p2[1]);
    
    return {
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${maxX - minX}px`,
      height: `${maxY - minY}px`,
    };
  };

  // Handle mouse down for starting annotation
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedAnnotationType || !layerRef.current) return;

    const rect = layerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedAnnotationType === 'comment' || selectedAnnotationType === 'text') {
      // For comments and text, show input at click position
      setAnnotationInput({ type: selectedAnnotationType, x, y });
      setInputValue('');
    } else {
      // For highlight and shape, start drawing
      setIsDrawing(true);
      setStartPoint({ x, y });
      setCurrentRect({ x, y, width: 0, height: 0 });
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !layerRef.current) return;

    const rect = layerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCurrentRect({
      x: width < 0 ? currentX : startPoint.x,
      y: height < 0 ? currentY : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  // Handle mouse up for finishing annotation
  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !selectedAnnotationType) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRect(null);
      return;
    }

    // Only create annotation if there's meaningful size
    if (currentRect.width > 5 && currentRect.height > 5) {
      const color = selectedAnnotationType === 'highlight' ? '#ffff00' : '#ff6b6b';
      
      addAnnotation({
        type: selectedAnnotationType,
        pageNumber: currentPage,
        color,
        position: {
          x: currentRect.x / (viewport?.width || 1),
          y: currentRect.y / (viewport?.height || 1),
          width: currentRect.width / (viewport?.width || 1),
          height: currentRect.height / (viewport?.height || 1),
        },
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  // Handle input submission for comment/text annotations
  const handleInputSubmit = () => {
    if (!annotationInput || !inputValue.trim() || !viewport) return;

    const color = annotationInput.type === 'comment' ? '#4dabf7' : '#333333';
    
    addAnnotation({
      type: annotationInput.type,
      pageNumber: currentPage,
      content: inputValue.trim(),
      color,
      position: {
        x: annotationInput.x / viewport.width,
        y: annotationInput.y / viewport.height,
      },
    });

    setAnnotationInput(null);
    setInputValue('');
  };

  // Calculate annotation style based on position and viewport
  const getAnnotationStyle = (annotation: Annotation) => {
    if (!viewport) return {};

    const x = annotation.position.x * viewport.width;
    const y = annotation.position.y * viewport.height;
    const width = annotation.position.width ? annotation.position.width * viewport.width : undefined;
    const height = annotation.position.height ? annotation.position.height * viewport.height : undefined;

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    };
  };

  return (
    <div
      ref={layerRef}
      className={cn(
        'absolute inset-0',
        selectedAnnotationType ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDrawing) {
          handleMouseUp();
        }
      }}
      style={{
        width: viewport ? `${viewport.width}px` : '100%',
        height: viewport ? `${viewport.height}px` : '100%',
      }}
    >
      {/* Render existing annotations */}
      {currentPageAnnotations.map((annotation) => (
        <div
          key={annotation.id}
          className={cn(
            'absolute group',
            annotation.type === 'highlight' && 'pointer-events-none',
            annotation.type === 'shape' && 'border-2',
            (annotation.type === 'comment' || annotation.type === 'text') && 'flex items-start gap-1'
          )}
          style={{
            ...getAnnotationStyle(annotation),
            backgroundColor:
              annotation.type === 'highlight'
                ? `${annotation.color}80`
                : annotation.type === 'shape'
                ? 'transparent'
                : undefined,
            borderColor: annotation.type === 'shape' ? annotation.color : undefined,
            color: annotation.type === 'text' ? annotation.color : undefined,
          }}
          onClick={(e) => {
            // Only open popup for annotations with content (comments and text)
            if (annotation.content) {
              e.stopPropagation();
              const annotationStyle = getAnnotationStyle(annotation);
              setSelectedAnnotation({
                annotation,
                x: parseFloat(annotationStyle.left as string) || 0,
                y: parseFloat(annotationStyle.top as string) || 0,
              });
            }
          }}
        >
          {annotation.type === 'comment' && (
            <div className="flex items-center gap-1 bg-white rounded px-2 py-1 shadow-md border border-border pointer-events-auto">
              <MessageSquare className="h-3 w-3 flex-shrink-0" style={{ color: annotation.color }} />
              <span className="text-xs max-w-[200px] truncate">{annotation.content}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAnnotation(annotation.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {annotation.type === 'text' && (
            <div
              className="bg-white rounded px-2 py-1 shadow-md border border-border pointer-events-auto text-xs"
              style={{ color: annotation.color }}
            >
              <div className="flex items-center gap-1">
                <span className="max-w-[200px] break-words">{annotation.content}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAnnotation(annotation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          {annotation.type === 'shape' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeAnnotation(annotation.id);
              }}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* Show current drawing */}
      {isDrawing && currentRect && selectedAnnotationType && (
        <div
          className={cn(
            'absolute',
            selectedAnnotationType === 'highlight' && 'bg-yellow-400 opacity-50',
            selectedAnnotationType === 'shape' && 'border-2 border-red-500'
          )}
          style={{
            left: `${currentRect.x}px`,
            top: `${currentRect.y}px`,
            width: `${currentRect.width}px`,
            height: `${currentRect.height}px`,
          }}
        />
      )}

      {/* Draggable Annotation Detail Popup */}
      {selectedAnnotation && (
        <DraggableAnnotationPopup
          annotation={selectedAnnotation.annotation}
          position={{ x: selectedAnnotation.x, y: selectedAnnotation.y }}
          onClose={() => setSelectedAnnotation(null)}
          onDelete={() => {
            removeAnnotation(selectedAnnotation.annotation.id);
            setSelectedAnnotation(null);
          }}
          onUpdate={(content) => {
            updateAnnotation(selectedAnnotation.annotation.id, { content });
            setSelectedAnnotation(null);
          }}
        />
      )}

      {/* Input for comment/text annotations */}
      {annotationInput && (
        <div
          className="absolute z-10 bg-white rounded-md shadow-lg border border-border p-2 min-w-[200px]"
          style={{
            left: `${annotationInput.x}px`,
            top: `${annotationInput.y}px`,
          }}
        >
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder={`Enter ${annotationInput.type}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputSubmit();
                } else if (e.key === 'Escape') {
                  setAnnotationInput(null);
                  setInputValue('');
                }
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={handleInputSubmit} className="h-7 flex-1">
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAnnotationInput(null);
                  setInputValue('');
                }}
                className="h-7"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Render native annotations (Links) */}
      {nativeAnnotations.map((annot, index) => {
        if (annot.subtype === 'Link' && annot.rect) {
          const style = getNativeAnnotationStyle(annot.rect);
          return (
            <a
              key={`native-${index}`}
              href={annot.url || '#'}
              target={annot.url ? '_blank' : undefined}
              rel={annot.url ? 'noopener noreferrer' : undefined}
              className="absolute hover:bg-yellow-500/20 transition-colors cursor-pointer z-10"
              style={style}
              onClick={(e) => {
                if (annot.dest) {
                  e.preventDefault();
                  onNavigate?.(annot.dest);
                }
              }}
              title={annot.url || 'Go to destination'}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
