'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Highlighter, Square, Type, Search, X } from 'lucide-react';
import { usePDFStore, Annotation } from '@/lib/pdf-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PDFAnnotationsListProps {
  onNavigate: (pageNumber: number, annotationId: string) => void;
  currentPage: number;
}

/**
 * Format the annotation display text based on type
 */
function getAnnotationDisplayText(annotation: Annotation): string {
  if (annotation.content) {
    return annotation.content;
  }
  
  // For annotations without content (like highlights and shapes)
  switch (annotation.type) {
    case 'highlight':
      return 'Highlighted text';
    case 'shape':
      return 'Shape annotation';
    default:
      return 'Annotation';
  }
}

interface AnnotationItemProps {
  annotation: Annotation;
  isActive: boolean;
  onNavigate: (pageNumber: number, annotationId: string) => void;
}

/**
 * Individual annotation list item component
 */
function AnnotationItem({ annotation, isActive, onNavigate }: AnnotationItemProps) {
  const displayText = getAnnotationDisplayText(annotation);
  const date = new Date(annotation.timestamp).toLocaleDateString();

  // Render the appropriate icon based on annotation type
  const renderIcon = () => {
    const iconProps = {
      className: "h-4 w-4",
      style: { color: annotation.color }
    };

    switch (annotation.type) {
      case 'highlight':
        return <Highlighter {...iconProps} />;
      case 'comment':
        return <MessageSquare {...iconProps} />;
      case 'shape':
        return <Square {...iconProps} />;
      case 'text':
        return <Type {...iconProps} />;
      default:
        return <MessageSquare {...iconProps} />;
    }
  };

  return (
    <button
      onClick={() => onNavigate(annotation.pageNumber, annotation.id)}
      className={cn(
        'flex w-full items-start gap-2 rounded px-3 py-2 text-left text-sm hover:bg-accent transition-colors',
        isActive && 'bg-accent/50'
      )}
    >
      {/* Icon with color indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {renderIcon()}
      </div>
      
      {/* Annotation content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate" title={displayText}>
          {displayText}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            Page {annotation.pageNumber}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {date}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Filter annotations based on search query
 */
function filterAnnotations(annotations: Annotation[], query: string): Annotation[] {
  if (!query.trim()) return annotations;

  const lowerQuery = query.toLowerCase();
  
  return annotations.filter((annotation) => {
    // Search in content
    if (annotation.content?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in type
    if (annotation.type.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in page number
    if (annotation.pageNumber.toString().includes(lowerQuery)) {
      return true;
    }
    
    return false;
  });
}

/**
 * PDFAnnotationsList component - displays all annotations in a sidebar
 * Allows users to view and navigate to annotations throughout the document
 */
export function PDFAnnotationsList({ onNavigate, currentPage }: PDFAnnotationsListProps) {
  const { annotations } = usePDFStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort annotations: first by page number, then by timestamp
  const filteredAnnotations = useMemo(() => {
    const filtered = filterAnnotations(annotations, searchQuery);
    return filtered.sort((a, b) => {
      // Sort by page number first
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      // Then by timestamp (newest first within same page)
      return b.timestamp - a.timestamp;
    });
  }, [annotations, searchQuery]);

  // Group annotations by page for better organization
  const annotationsByPage = useMemo(() => {
    const grouped = new Map<number, Annotation[]>();
    
    filteredAnnotations.forEach((annotation) => {
      const pageAnnotations = grouped.get(annotation.pageNumber) || [];
      pageAnnotations.push(annotation);
      grouped.set(annotation.pageNumber, pageAnnotations);
    });
    
    return grouped;
  }, [filteredAnnotations]);

  if (annotations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No annotations yet</p>
        <p className="text-xs mt-1">Use the toolbar to add annotations</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search Input */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search annotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Annotations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Annotations ({filteredAnnotations.length})
          </div>
          
          {filteredAnnotations.length > 0 ? (
            <div className="space-y-3">
              {/* Render annotations grouped by page */}
              {Array.from(annotationsByPage.entries()).map(([pageNumber, pageAnnotations]) => (
                <div key={pageNumber}>
                  {/* Page header (only show if there are multiple pages with annotations) */}
                  {annotationsByPage.size > 1 && (
                    <div className="px-2 text-xs font-medium text-muted-foreground mb-1">
                      Page {pageNumber}
                    </div>
                  )}
                  
                  {/* Annotations for this page */}
                  <div className="space-y-1">
                    {pageAnnotations.map((annotation) => (
                      <AnnotationItem
                        key={annotation.id}
                        annotation={annotation}
                        isActive={annotation.pageNumber === currentPage}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No annotations match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
