import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { DeleteIcon } from "../../components/ui/icons";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { useAsync } from "../../hooks/useAsync";
import { checkResourceFile, deleteResource, listResources, setResourceStatus, type DevResource, type FileCheck } from "../../lib/developerApi";
import { formatBytes, resourceTypeLabel } from "../../utils/format";
import { Card, Field, Notice, TextInput } from "./shared";

const NEXT: Record<DevResource["status"], { to: DevResource["status"]; label: string; done: string }> = {
  published: { to: "archived", label: "Archive", done: "Archived." },
  draft: { to: "published", label: "Publish", done: "Published." },
  archived: { to: "published", label: "Publish", done: "Published." },
};
const CHECK_TEXT: Record<FileCheck, string> = {
  ok: "File is reachable.",
  missing: "File is missing from storage.",
  unverifiable: "Couldn't verify from the browser (storage may block cross-origin reads).",
};

export function ResourcesPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const list = useAsync(listResources, []);
  const confirm = useConfirm();
  const toast = useToast();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");
  const [checks, setChecks] = useState<Record<string, FileCheck | "checking">>({});

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (list.data ?? []).filter((r) => (!status || r.status === status) && (!n || `${r.title} ${r.subject?.code ?? ""} ${r.subject?.name ?? ""}`.toLowerCase().includes(n)));
  }, [list.data, q, status]);

  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    try { await fn(); toast(ok); list.reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Something went wrong.", "error"); }
    finally { setBusyId(""); }
  }

  async function remove(r: DevResource) {
    const yes = await confirm({ title: "Delete this resource?", body: <>“{r.title}” and its stored PDF will be removed permanently.</>, confirmLabel: "Delete", tone: "danger" });
    if (yes) await act(r.id, () => deleteResource(r.id).then((x) => { if (!x.ok) throw new Error(x.message ?? "Delete failed."); }), "Resource deleted.");
  }

  async function check(id: string) {
    setChecks((c) => ({ ...c, [id]: "checking" }));
    try { const res = await checkResourceFile(id); setChecks((c) => ({ ...c, [id]: res })); }
    catch (e) { setChecks((c) => { const n = { ...c }; delete n[id]; return n; }); toast(e instanceof Error ? e.message : "Couldn't check that file.", "error"); }
  }

  return (
    <Card title="Resources">
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Filter"><TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or subject" /></Field>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      {list.loading && !list.data ? <p className="t-label" role="status">Loading…</p> : list.error ? <Notice tone="error">{list.error.message}</Notice> : (
        <div className="divide-y divide-line">
          {rows.map((r) => {
            const c = checks[r.id];
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{r.title}</p>
                  <p className="t-meta mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {r.subject && <span className="t-code text-ink-2">{r.subject.code}</span>}
                    <span>{resourceTypeLabel(r.resource_type)}</span>
                    {r.resource_type === "pyq" && (r.academic_year ? <span className="t-code text-ink">{r.academic_year}</span> : <span className="font-medium text-ink">no year</span>)}
                    <span>{[r.status, formatBytes(r.file_size_bytes)].filter(Boolean).join(" · ")}</span>
                  </p>
                  {c && <p className="t-meta mt-1.5 text-ink" role="status">{c === "checking" ? "Checking…" : CHECK_TEXT[c]}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {r.status === "published" && <>
                    <Button variant="ghost" className="!min-h-9 !px-3" disabled={c === "checking"} onClick={() => void check(r.id)}>Check file</Button>
                    <Link to={`/resources/${r.id}`} className="t-small px-2 underline-offset-4 hover:text-ink hover:underline">View</Link>
                  </>}
                  <Button variant="outline" className="!min-h-9 !px-3" disabled={busyId === r.id} onClick={() => void act(r.id, () => setResourceStatus(r.id, NEXT[r.status].to), NEXT[r.status].done)}>{NEXT[r.status].label}</Button>
                  <button type="button" aria-label={`Delete ${r.title}`} disabled={busyId === r.id} onClick={() => void remove(r)} className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-40"><DeleteIcon size={16} /></button>
                </div>
              </div>
            );
          })}
          {!rows.length && <p className="t-small pt-1">{list.data?.length ? "No resources match that filter." : "No resources uploaded yet."}</p>}
        </div>
      )}
    </Card>
  );
}
