import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { getResourceUrl } from "../../lib/api";
import { friendlyMessage } from "../../lib/errors";
import type { Resource } from "../../types";
import { AnchorButton, Button } from "../ui/Button";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalIcon, FileIcon } from "../ui/icons";

type Busy = "preview" | "download" | null;

/** Preview, download and share for a stored PDF (short-lived signed URLs from the resource-url Edge Function). */
export function ResourceViewer({ resource }: { resource: Resource }) {
  const { triggerDownloadCelebration } = useSettings();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  async function preview() {
    setBusy("preview"); setError("");
    try {
      const res = await getResourceUrl(resource.id, "inline");
      setPreviewUrl(res.url);
    } catch (e) { setError(friendlyMessage(e)); } finally { setBusy(null); }
  }

  async function download() {
    setBusy("download"); setError("");
    try {
      const res = await getResourceUrl(resource.id, "attachment");
      const a = document.createElement("a");
      a.href = res.url; a.rel = "noopener"; a.download = res.fileName ?? "";
      document.body.appendChild(a); a.click(); a.remove();
      triggerDownloadCelebration();
    } catch (e) { setError(friendlyMessage(e)); } finally { setBusy(null); }
  }

  /** Shares the page link (never the signed file URL, which expires in minutes). */
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch { setError("Couldn't copy the link. You can copy it from the address bar."); }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="primary" onClick={download} disabled={busy !== null}>
          <DownloadIcon size={16} /> {busy === "download" ? "Preparing…" : "Download PDF"}
        </Button>
        <Button variant="outline" onClick={preview} disabled={busy !== null}>
          <FileIcon size={16} /> {busy === "preview" ? "Loading preview…" : previewUrl ? "Refresh preview" : "Preview"}
        </Button>
        <Button variant="ghost" onClick={() => void copyLink()} aria-live="polite">
          {copied ? <><CheckIcon size={16} /> Link copied</> : <><CopyIcon size={16} /> Copy link</>}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-error/20 bg-error-container p-3 text-xs font-semibold text-on-error-container">
          {error}
        </p>
      )}

      {previewUrl && (
        <div className="anim-fade mt-5">
          {/* Desktop: inline viewer. Phones get a direct open link. */}
          <iframe
            title={`Preview of ${resource.title}`}
            src={previewUrl}
            className="hidden h-[75vh] w-full rounded-lg border border-outline-variant bg-surface lg:block"
          />
          <div className="lg:hidden">
            <AnchorButton variant="outline" href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalIcon size={16} /> Open PDF
            </AnchorButton>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">
            This secure link expires in a few minutes. Use “Refresh preview” if it stops loading.
          </p>
        </div>
      )}
      <p className="mt-4 text-xs text-on-surface-variant">
        PDFs need an internet connection — they aren't saved for offline use.
      </p>
    </div>
  );
}
