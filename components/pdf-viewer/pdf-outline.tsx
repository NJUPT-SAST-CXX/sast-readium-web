'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Search, X } from 'lucide-react';
import { PDFOutlineNode } from '@/lib/pdf-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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

// Helper function to filter outline nodes based on search query
function filterOutlineNodes(nodes: PDFOutlineNode[], query: string): PDFOutlineNode[] {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();
  const filtered: PDFOutlineNode[] = [];

  for (const node of nodes) {
    // Check if current node matches
    const matchesTitle = node.title.toLowerCase().includes(lowerQuery);
    
    // Recursively filter children
    const filteredChildren = node.items ? filterOutlineNodes(node.items, query) : [];
    
    // Include node if it matches or has matching children
    if (matchesTitle || filteredChildren.length > 0) {
      filtered.push({
        ...node,
        items: filteredChildren.length > 0 ? filteredChildren : node.items,
      });
    }
  }

  return filtered;
}

export function PDFOutline({ outline, onNavigate, currentPage }: PDFOutlineProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter outline based on search query
  const filteredOutline = useMemo(() => {
    return filterOutlineNodes(outline, searchQuery);
  }, [outline, searchQuery]);

  if (!outline || outline.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <BookOpen className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No bookmarks available</p>
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
            placeholder="Search bookmarks..."
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

      {/* Bookmarks List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Bookmarks {searchQuery && `(${filteredOutline.length} results)`}
          </div>
          {filteredOutline.length > 0 ? (
            filteredOutline.map((item, index) => (
              <OutlineItem
                key={index}
                item={item}
                level={0}
                onNavigate={onNavigate}
                currentPage={currentPage}
              />
            ))
          ) : (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No bookmarks match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

