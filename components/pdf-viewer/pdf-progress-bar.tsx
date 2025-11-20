'use client';

import { usePDFStore } from '@/lib/pdf-store';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PDFProgressBarProps {
  className?: string;
}

export function PDFProgressBar({ className }: PDFProgressBarProps) {
  const { currentPage, numPages } = usePDFStore();

  // Calculate progress percentage
  const progress = numPages > 0 ? ((currentPage - 1) / (numPages - 1)) * 100 : 0;

  return (
    <div
      className={cn(
        // Fixed positioning at bottom of viewport
        'fixed bottom-0 left-0 right-0 z-50',
        // Background and border styling
        'bg-background/95 backdrop-blur-sm border-t border-border',
        // Padding - responsive for mobile
        'px-3 py-2 sm:px-4 sm:py-2.5',
        // Shadow for depth
        'shadow-lg',
        className
      )}
    >
      {/* Progress bar */}
      <Progress value={Math.min(100, Math.max(0, progress))} />
      
      {/* Page info - responsive text sizing */}
      <div className="mt-1 sm:mt-1.5 flex justify-between text-xs sm:text-sm text-muted-foreground">
        <span className="font-medium">Page {currentPage}</span>
        <span className="font-semibold tabular-nums">{Math.round(progress)}%</span>
        <span className="font-medium">{numPages} pages</span>
      </div>
    </div>
  );
}
