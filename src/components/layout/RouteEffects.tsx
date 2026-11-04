import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to top on navigation and move focus to the main region for keyboard / screen-reader users. */
export function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
