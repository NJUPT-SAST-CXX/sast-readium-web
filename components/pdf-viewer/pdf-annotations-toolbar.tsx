'use client';

import { Highlighter, MessageSquare, Square, Type, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { usePDFStore } from '@/lib/pdf-store';
import { cn } from '@/lib/utils';

interface PDFAnnotationsToolbarProps {
  onAnnotationTypeSelect: (type: 'highlight' | 'comment' | 'shape' | 'text' | null) => void;
  selectedType: 'highlight' | 'comment' | 'shape' | 'text' | null;
  className?: string;
}

export function PDFAnnotationsToolbar({
  onAnnotationTypeSelect,
  selectedType,
  className,
}: PDFAnnotationsToolbarProps) {
  const { annotations, removeAnnotation, currentPage } = usePDFStore();

  const currentPageAnnotations = annotations.filter(
    (a) => a.pageNumber === currentPage
  );

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2 border-t border-border bg-background p-2', className)}>
        <div className="text-xs font-medium text-muted-foreground">
          Annotations:
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={selectedType === 'highlight' ? 'default' : 'ghost'}
              size="icon"
              onClick={() =>
                onAnnotationTypeSelect(
                  selectedType === 'highlight' ? null : 'highlight'
                )
              }
              className="h-8 w-8"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Highlight Text</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={selectedType === 'comment' ? 'default' : 'ghost'}
              size="icon"
              onClick={() =>
                onAnnotationTypeSelect(
                  selectedType === 'comment' ? null : 'comment'
                )
              }
              className="h-8 w-8"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Comment</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={selectedType === 'shape' ? 'default' : 'ghost'}
              size="icon"
              onClick={() =>
                onAnnotationTypeSelect(selectedType === 'shape' ? null : 'shape')
              }
              className="h-8 w-8"
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Draw Shape</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={selectedType === 'text' ? 'default' : 'ghost'}
              size="icon"
              onClick={() =>
                onAnnotationTypeSelect(selectedType === 'text' ? null : 'text')
              }
              className="h-8 w-8"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Text</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {currentPageAnnotations.length} on this page
          </span>
          
          {currentPageAnnotations.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    currentPageAnnotations.forEach((a) => removeAnnotation(a.id));
                  }}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Page Annotations</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
