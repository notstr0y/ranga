import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = a destructive action; the confirm button is drawn in the accent. */
  tone?: "default" | "danger";
}

type Ask = (o: ConfirmOptions) => Promise<boolean>;
const Ctx = createContext<Ask | null>(null);

/** Replaces window.confirm everywhere: `const confirm = useConfirm(); if (!(await confirm({...}))) return;` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const ask = useCallback<Ask>((opts) => new Promise<boolean>((resolve) => setReq({ opts, resolve })), []);
  const settle = (v: boolean) => { req?.resolve(v); setReq(null); };
  const o = req?.opts;

  return (
    <Ctx.Provider value={ask}>
      {children}
      <Dialog open={!!req} onClose={() => settle(false)} labelledBy="confirm-title" size="sm">
        <h2 id="confirm-title" className="t-title">{o?.title}</h2>
        {o?.body && <div className="t-small mt-3">{o.body}</div>}
        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => settle(false)}>{o?.cancelLabel ?? "Cancel"}</Button>
          <Button variant={o?.tone === "danger" ? "danger" : "primary"} onClick={() => settle(true)} data-autofocus>{o?.confirmLabel ?? "Confirm"}</Button>
        </div>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): Ask {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return v;
}
