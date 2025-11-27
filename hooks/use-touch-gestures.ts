import { useEffect, useRef, useCallback } from "react";

interface TouchGesturesOptions {
  onPinchZoom?: (scale: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  minSwipeDistance?: number;
  doubleTapDelay?: number;
  longPressDelay?: number;
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TouchGesturesOptions
) {
  const touchStartRef = useRef<{
    x: number;
    y: number;
    distance: number;
    time: number;
  } | null>(null);
  const initialPinchDistance = useRef<number>(0);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const minSwipeDistance = options.minSwipeDistance || 50;
    const doubleTapDelay = options.doubleTapDelay || 300;
    const longPressDelay = options.longPressDelay || 500;

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();

        // Single touch - for swipe, double-tap, and long-press
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          distance: 0,
          time: now,
        };

        isLongPressRef.current = false;

        // Start long-press timer
        if (options.onLongPress) {
          clearLongPressTimer();
          longPressTimerRef.current = setTimeout(() => {
            if (touchStartRef.current) {
              isLongPressRef.current = true;
              options.onLongPress?.(touch.clientX, touch.clientY);
            }
          }, longPressDelay);
        }
      } else if (e.touches.length === 2) {
        // Two fingers - for pinch zoom
        clearLongPressTimer();
        initialPinchDistance.current = getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long-press if finger moves too much
      if (e.touches.length === 1 && touchStartRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

        if (deltaX > 10 || deltaY > 10) {
          clearLongPressTimer();
        }
      }

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
      clearLongPressTimer();

      if (e.touches.length === 0 && touchStartRef.current) {
        const touchEnd = e.changedTouches[0];
        const now = Date.now();
        const deltaX = touchEnd.clientX - touchStartRef.current.x;
        const deltaY = touchEnd.clientY - touchStartRef.current.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const touchDuration = now - touchStartRef.current.time;

        // If it was a long press, don't process as tap or swipe
        if (isLongPressRef.current) {
          touchStartRef.current = null;
          isLongPressRef.current = false;
          return;
        }

        // Check for tap (minimal movement and short duration)
        const isTap = absX < 10 && absY < 10 && touchDuration < 300;

        if (isTap && options.onDoubleTap) {
          // Check for double-tap
          if (
            lastTapRef.current &&
            now - lastTapRef.current.time < doubleTapDelay
          ) {
            // Calculate distance between taps
            const tapDistance = Math.sqrt(
              Math.pow(touchEnd.clientX - lastTapRef.current.x, 2) +
                Math.pow(touchEnd.clientY - lastTapRef.current.y, 2)
            );

            if (tapDistance < 50) {
              // Double-tap detected
              e.preventDefault();
              options.onDoubleTap(touchEnd.clientX, touchEnd.clientY);
              lastTapRef.current = null;
            } else {
              lastTapRef.current = {
                x: touchEnd.clientX,
                y: touchEnd.clientY,
                time: now,
              };
            }
          } else {
            // First tap
            lastTapRef.current = {
              x: touchEnd.clientX,
              y: touchEnd.clientY,
              time: now,
            };
          }
        } else if (absX > minSwipeDistance || absY > minSwipeDistance) {
          // Swipe gesture
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

    const handleTouchCancel = () => {
      clearLongPressTimer();
      touchStartRef.current = null;
      isLongPressRef.current = false;
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      clearLongPressTimer();
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [elementRef, options, clearLongPressTimer]);
}
