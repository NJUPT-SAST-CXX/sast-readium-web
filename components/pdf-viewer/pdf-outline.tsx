'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { PDFOutlineNode } from '@/lib/pdf-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PDFOutlineProps {
  outline: PDFOutlineNode[];
  onNavigate: (pageNumber: number) => void;
  currentPage: number;
}

interface OutlineItemProps {
  item: PDFOutlineNode;
  level: number;
  onNavigate: (pageNumber: number) => void;
  currentPage: number;
}

function OutlineItem({ item, level, onNavigate, currentPage }: OutlineItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    if (item.pageNumber) {
      onNavigate(item.pageNumber);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors',
          item.pageNumber === currentPage && 'bg-accent/50',
          item.bold && 'font-semibold',
          item.italic && 'italic'
        )}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          color: item.color ? `rgb(${item.color.join(',')})` : undefined,
        }}
      >
        {hasChildren && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <span className="flex-1 truncate" title={item.title}>
          {item.title}
        </span>
        {item.pageNumber && (
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {item.pageNumber}
          </span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {item.items!.map((child, index) => (
            <OutlineItem
              key={index}
              item={child}
              level={level + 1}
              onNavigate={onNavigate}
              currentPage={currentPage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PDFOutline({ outline, onNavigate, currentPage }: PDFOutlineProps) {
  if (!outline || outline.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <BookOpen className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No bookmarks available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
          Bookmarks
        </div>
        {outline.map((item, index) => (
          <OutlineItem
            key={index}
            item={item}
            level={0}
            onNavigate={onNavigate}
            currentPage={currentPage}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

