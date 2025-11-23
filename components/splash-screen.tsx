"use client";

import { useEffect, useState } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const enableSplashScreen = usePDFStore((state) => state.enableSplashScreen);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only run on client side
    const hasShown = sessionStorage.getItem("hasShownSplashScreen");
    
    if (enableSplashScreen && !hasShown) {
      const mountTimer = setTimeout(() => {
        setShouldRender(true);
      }, 0);

      // Small delay to ensure transition happens
      // Use setTimeout to move it to the next tick, avoiding synchronous setState warning if that was the issue
      // But here it is cleaner to just let it happen.
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("hasShownSplashScreen", "true");
        
        // Remove from DOM after fade out
        setTimeout(() => setShouldRender(false), 1000);
      }, 2500);

      return () => {
        clearTimeout(mountTimer);
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [enableSplashScreen]);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
          <div className="relative z-10 bg-card p-4 rounded-2xl border shadow-lg">
            <FileText className="h-16 w-16 text-primary animate-bounce duration-[3000ms]" />
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 animate-pulse">
            Readium
          </h1>
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
            PDF Reader
          </p>
        </div>
      </div>
    </div>
  );
}
