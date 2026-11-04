import { useCallback, useEffect, useRef, useState } from "react";
import welcome from "../../assets/ranga/ranga-welcome.webp";
import { Button } from "../ui/Button";

/**
 * Persistence: the welcome screen is shown once per browser SESSION (sessionStorage). It appears on the first load of a
 * session, never again during navigation or a refresh in the same tab, and returns when the app is opened afresh.
 * It never closes by itself: only the person pressing "Enter" (or tapping the screen / pressing Escape) closes it.
 * There is deliberately no way to replay it from inside the app.
 *
 * The artwork is drawn on near-black, so this one screen stays dark (ink) while the rest of the app is paper.
 */
const KEY = "ranga.welcome.session";

function alreadyShown(): boolean {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}
function remember() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: shows once per page load */ }
}

export function WelcomeOverlay() {
  const [open, setOpen] = useState(() => !alreadyShown());
  const [leaving, setLeaving] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  const enter = useCallback(() => {
    remember();
    setLeaving(true);
    setTimeout(() => { setOpen(false); setLeaving(false); }, 280);
  }, []);

  useEffect(() => {
    if (!open) return;
    remember(); // a refresh while it is open still counts as "shown this session"
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") enter(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, enter]);

  if (!open) return null;

  return (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
      onClick={enter}
      className={`fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-[#0c0c0c] focus:outline-none transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      {/* The image keeps its own aspect ratio and embedded type; nothing is cropped or recoloured. */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-4 pt-6">
        <img
          src={welcome}
          alt="Ranga, hands folded in greeting, with the words “മോനേ, ഹാപ്പി അല്ലേ?”"
          width={941}
          height={1672}
          decoding="async"
          fetchPriority="high"
          className="anim-fade feather-edges max-h-full w-auto max-w-full object-contain"
        />
      </div>
      <div className="pb-safe flex w-full flex-col items-center gap-3 px-6 pb-8 pt-2">
        <Button variant="inverse" onClick={(e) => { e.stopPropagation(); enter(); }} className="min-w-44">Enter</Button>
      </div>
    </div>
  );
}
