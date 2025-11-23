import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface OpenDocument {
  id: string;
  file: File;
  title: string;
}

interface PDFTabBarProps {
  documents: OpenDocument[];
  activeDocumentId: string | null;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  className?: string;
}

export function PDFTabBar({
  documents,
  activeDocumentId,
  onSwitch,
  onClose,
  className,
}: PDFTabBarProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeDocumentId]);

  return (
    <div className={cn("w-full border-b border-border bg-muted/30", className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex h-10 items-center px-2 gap-1">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                className={cn(
                  "group relative flex items-center h-8 pl-2.5 pr-1 rounded-md border transition-all duration-200 select-none",
                  isActive
                    ? "bg-background border-border shadow-sm z-10"
                    : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <button
                  ref={isActive ? activeTabRef : null}
                  onClick={() => onSwitch(doc.id)}
                  className="flex items-center gap-2 mr-1 outline-none focus-visible:ring-0"
                >
                  <FileText className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                  <span className="text-xs font-medium max-w-[160px] truncate leading-none">
                    {doc.title}
                  </span>
                </button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive && "opacity-100 hover:bg-muted"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(doc.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
}
