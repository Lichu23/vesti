"use client";

import { useEffect } from "react";

import { useIsMobile } from "./use-is-mobile";

export function StorefrontViewportMode() {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.dataset.storefrontViewport = isMobile
      ? "mobile"
      : "desktop";

    return () => {
      delete document.documentElement.dataset.storefrontViewport;
    };
  }, [isMobile]);

  return null;
}
