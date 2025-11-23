import { useEffect, useRef } from "react";

interface TouchGesturesOptions {
  onPinchZoom?: (scale: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TouchGesturesOptions
) {
  const touchStartRef = useRef<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);
  const initialPinchDistance = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const minSwipeDistance = options.minSwipeDistance || 50;

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - for swipe
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          distance: 0,
        };
      } else if (e.touches.length === 2) {
        // Two fingers - for pinch zoom
        initialPinchDistance.current = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance.current > 0) {
        // Pinch zoom
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / initialPinchDistance.current;

        if (options.onPinchZoom) {
          options.onPinchZoom(scale);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && touchStartRef.current) {
        // Swipe gesture
        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStartRef.current.x;
        const deltaY = touchEnd.clientY - touchStartRef.current.y;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > minSwipeDistance || absY > minSwipeDistance) {
          if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0 && options.onSwipeRight) {
              options.onSwipeRight();
            } else if (deltaX < 0 && options.onSwipeLeft) {
              options.onSwipeLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0 && options.onSwipeDown) {
              options.onSwipeDown();
            } else if (deltaY < 0 && options.onSwipeUp) {
              options.onSwipeUp();
            }
          }
        }

        touchStartRef.current = null;
      } else if (e.touches.length < 2) {
        // Reset pinch zoom
        initialPinchDistance.current = 0;
      }
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, options]);
}
