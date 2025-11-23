import { Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type LoadingAnimationType = 'spinner' | 'pulse' | 'bar';

interface PDFLoadingAnimationProps {
  type: LoadingAnimationType;
  className?: string;
  progress?: number;
}

export function PDFLoadingAnimation({ type, className, progress }: PDFLoadingAnimationProps) {
  const { t } = useTranslation();

  if (type === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center gap-6", className)}>
         <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <BookOpen className="h-16 w-16 text-primary relative z-10 animate-pulse" />
         </div>
         <div className="space-y-2 w-48 text-center">
            <p className="text-sm font-medium text-muted-foreground animate-pulse">{t('viewer.loading_document')}</p>
            {progress !== undefined && (
              <div className="h-1 w-full bg-secondary overflow-hidden rounded-full">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            )}
         </div>
      </div>
    );
  }
  
  if (type === 'bar') {
    return (
       <div className={cn("w-64 space-y-3", className)}>
          <div className="flex justify-between text-sm text-muted-foreground">
             <span className="font-medium">{t('viewer.loading_pdf')}</span>
             <span>{progress !== undefined ? `${Math.round(progress)}%` : '...'}</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
             {progress !== undefined ? (
               <div 
                 className="h-full bg-primary transition-all duration-300 ease-out" 
                 style={{ width: `${progress}%` }} 
               />
             ) : (
               <div className="h-full bg-primary animate-[indeterminate_1.5s_infinite_linear] origin-left w-[50%]" />
             )}
          </div>
       </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {progress !== undefined && (
        <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
      )}
    </div>
  );
}
