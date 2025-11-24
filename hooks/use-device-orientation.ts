"use client";

import { useEffect, useState } from "react";

type Orientation = "portrait" | "landscape";

interface OrientationState {
  orientation: Orientation;
  isMobile: boolean;
  width: number;
  height: number;
}

const MOBILE_MEDIA_QUERY = "(max-width: 640px)";

const getInitialState = (): OrientationState => {
  if (typeof window === "undefined") {
    return {
      orientation: "portrait",
      isMobile: false,
      width: 0,
      height: 0,
    };
  }

  const { innerWidth, innerHeight } = window;
  const isLandscape = innerWidth > innerHeight;
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;

  return {
    orientation: isLandscape ? "landscape" : "portrait",
    isMobile,
    width: innerWidth,
    height: innerHeight,
  };
};

export function useDeviceOrientation() {
  const [state, setState] = useState<OrientationState>(() => getInitialState());

  useEffect(() => {
    const updateState = () => {
      setState(getInitialState());
    };

    updateState();

    window.addEventListener("resize", updateState);
    window.addEventListener("orientationchange", updateState);

    return () => {
      window.removeEventListener("resize", updateState);
      window.removeEventListener("orientationchange", updateState);
    };
  }, []);

  const isLandscape = state.orientation === "landscape";
  const isPortrait = state.orientation === "portrait";
  const isMobileLandscape = state.isMobile && isLandscape;
  const isMobilePortrait = state.isMobile && isPortrait;

  return {
    orientation: state.orientation,
    isLandscape,
    isPortrait,
    isMobile: state.isMobile,
    isMobileLandscape,
    isMobilePortrait,
    viewportWidth: state.width,
    viewportHeight: state.height,
  } as const;
}
