import { useEffect } from "react";

/** Sets the tab/window title for the current page, e.g. "CST 201 · RANGA". */
export function useTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · RANGA` : "RANGA — KTU resources, all in one place";
  }, [title]);
}
