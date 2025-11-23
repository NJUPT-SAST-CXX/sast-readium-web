"use client";

import { useEffect, useState } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import Image from "next/image";
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
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
      )}
    >
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
        }
        .animate-glow-slow {
          animation: glow 4s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-90 duration-1000 slide-in-from-bottom-10">
        <div className="relative mb-10 group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/40 blur-[80px] rounded-full animate-glow-slow" />
          
          {/* Icon */}
          <div className="relative z-10 animate-float-slow">
            <Image 
              src="/app-icon.png" 
              alt="Readium Logo" 
              width={160} 
              height={160} 
              className="h-40 w-40 object-contain drop-shadow-2xl" 
              priority
            />
          </div>
        </div>
        
        <div className="space-y-4 text-center relative z-10">
          <h1 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 select-none">
            Readium
          </h1>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-xs tracking-[0.5em] uppercase font-medium select-none">
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-primary/50" />
            <span>PDF Reader</span>
            <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
