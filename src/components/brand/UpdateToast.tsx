import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "../ui/Button";

/** Appears when a new version of RANGA has been downloaded. Nothing reloads until the student agrees. */
export function UpdateToast() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => { void reg.update(); }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;
  return (
    <div role="status" className="pb-safe fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6 md:justify-end md:px-8">
      <div className="toast anim-rise flex w-full max-w-sm items-center gap-2 py-2.5 pl-5 pr-2.5">
        <p className="flex-1 text-[0.875rem]">A new version of RANGA is ready.</p>
        <Button className="!min-h-9 !px-3.5" onClick={() => void updateServiceWorker(true)}>Refresh</Button>
        <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setNeedRefresh(false)}>Later</Button>
      </div>
    </div>
  );
}
