import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon, WarningIcon } from "./icons";

type Tone = "ok" | "error";
interface Item { id: number; tone: Tone; text: string }
type Push = (text: string, tone?: Tone) => void;
const Ctx = createContext<Push | null>(null);

/** Short confirmations ("Programme added.") that fade away on their own; errors stay a little longer. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const next = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((l) => l.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<Push>((text, tone = "ok") => {
    const id = next.current++;
    setItems((l) => [...l.slice(-2), { id, tone, text }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), tone === "error" ? 7000 : 3800));
  }, [dismiss]);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-4 sm:items-end sm:px-6 sm:pb-6">
        {items.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className="toast anim-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 py-3 pl-4 pr-2">
            <span className="mt-0.5 shrink-0 text-ink">{t.tone === "error" ? <WarningIcon size={18} /> : <CheckIcon size={18} />}</span>
            <p className="min-w-0 flex-1 text-[0.875rem] leading-snug">{t.text}</p>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-paper-2 hover:text-ink">
              <CloseIcon size={15} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): Push {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v;
}
