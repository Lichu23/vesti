"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Scrolls to the very top whenever the route changes. Next only scrolls to the
 * top of the new page segment, which leaves the sticky header and search row
 * out of view. Search and sort keep the same path, so they keep their scroll,
 * and back/forward navigation keeps restoring the previous position.
 */
export function ScrollToTopOnNavigation() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const isHistoryNavigationRef = useRef(false);

  useEffect(() => {
    function handlePopState() {
      isHistoryNavigationRef.current = true;
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;

    if (isHistoryNavigationRef.current) {
      isHistoryNavigationRef.current = false;
      return;
    }

    window.scrollTo({ left: 0, top: 0 });
  }, [pathname]);

  return null;
}
