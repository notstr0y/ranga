import { useMemo, useState, type ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { useAsync } from "../../hooks/useAsync";
import { listCatalogueGaps, setResourceStatus, type GapSubject } from "../../lib/developerApi";

import type { ResourceType } from "../../types";
import { RESOURCE_TYPES, resourceTypeLabel } from "../../utils/format";
import type { Prefill } from "./UploadPanel";
import { Card, Notice } from "./shared";

type Missing = "any" | ResourceType;
const LIMIT = 10;

const where = (s: GapSubject) => `${s.semester.scheme.programme.code} · ${s.semester.scheme.code} · S${s.semester.semester_number}`;

/** A short list that opens to the full list on request. Empty = a plain "nothing to do". */
function Rows<T>({ items, render, empty }: { items: T[]; render: (t: T) => ReactNode; empty: string }) {
  const [all, setAll] = useState(false);
  if (!items.length) return <p className="t-small">{empty}</p>;
  const shown = all ? items : items.slice(0, LIMIT);
  return (
    <div>
      <ul className="-my-3 divide-y divide-line">{shown.map((t, i) => <li key={i} className="flex items-center gap-3 py-3">{render(t)}</li>)}</ul>
      {items.length > LIMIT && (
        <Button variant="ghost" className="!min-h-9 mt-3 -ml-3 !px-3" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${items.length}`}</Button>
      )}
    </div>
  );
}

/**
 * Replaces the old statistics page. It answers practical questions instead: what is missing, what is broken, what is
 * waiting for me. Every row has an action; there are no totals to admire.
 */
export function ChecksPanel({ onUpload, onFindResource }: { onUpload: (p: Prefill) => void; onFindResource: (q: string) => void }) {
  const gaps = useAsync(listCatalogueGaps, []);
  const toast = useToast();
  const [missing, setMissing] = useState<Missing>("pyq");
  const [busyId, setBusyId] = useState("");

  const data = useMemo(() => {
    const subjects = gaps.data?.subjects ?? [], resources = gaps.data?.resources ?? [];
    const published = resources.filter((r) => r.status === "published");
    const missingFor = subjects.filter((s) => !published.some((r) => r.subject_id === s.id && (missing === "any" || r.resource_type === missing)));
    return {
      missingFor,
      noYear: published.filter((r) => r.resource_type === "pyq" && !r.academic_year),
      waiting: resources.filter((r) => r.status !== "published"),
      unverified: subjects.filter((s) => s.verification_status === "needs_review"),
      subjectCode: new Map(subjects.map((s) => [s.id, s.code])),
    };
  }, [gaps.data, missing]);

  async function publish(id: string) {
    setBusyId(id);
    try { await setResourceStatus(id, "published"); toast("Published."); gaps.reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't publish.", "error"); }
    finally { setBusyId(""); }
  }

  if (gaps.error) return <Notice tone="error">{gaps.error.message}</Notice>;
  if (gaps.loading && !gaps.data) return <p className="t-label" role="status">Looking…</p>;

  return (
    <div className="space-y-5">
      <Card title="Missing materials" action={
        <div className="w-44">
          <Select label="Without" value={missing} onChange={(e) => setMissing(e.target.value as Missing)}>
            <option value="any">Any resource</option>
            {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.plural}</option>)}
          </Select>
        </div>
      }>
        <Rows items={data.missingFor} empty="Every subject has at least one published item of this kind." render={(s) => (
          <>
            <span className="t-code w-24 shrink-0">{s.code}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.9375rem]">{s.name}</span><span className="t-meta">{where(s)}</span></span>
            <Button variant="outline" className="!min-h-9 !px-3" onClick={() => onUpload({ programmeId: s.semester.scheme.programme.id, schemeId: s.semester.scheme.id, semesterId: s.semester.id, subjectId: s.id, type: missing === "any" ? undefined : missing })}>Upload</Button>
          </>
        )} />
      </Card>

      <Card title="Question papers without a year">
        <p className="t-small mb-4 max-w-prose">These are published but can't be found by year, so they only appear under "Any year".</p>
        <Rows items={data.noYear} empty="None. Every published question paper has a year." render={(r) => (
          <>
            <span className="t-code w-24 shrink-0">{(r.subject_id && data.subjectCode.get(r.subject_id)) || "—"}</span>
            <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{r.title}</span>
            <Button variant="outline" className="!min-h-9 !px-3" onClick={() => onFindResource(r.title)}>Find</Button>
          </>
        )} />
      </Card>

      <Card title="Waiting for you">
        <Rows items={data.waiting} empty="No drafts or archived items." render={(r) => (
          <>
            <span className="t-code w-24 shrink-0">{(r.subject_id && data.subjectCode.get(r.subject_id)) || "—"}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.9375rem]">{r.title}</span><span className="t-meta">{resourceTypeLabel(r.resource_type)} · {r.status}</span></span>
            <Button variant="outline" className="!min-h-9 !px-3" disabled={busyId === r.id} onClick={() => void publish(r.id)}>Publish</Button>
          </>
        )} />
      </Card>

      <Card title="Unverified subjects">
        <Rows items={data.unverified} empty="Every subject has been checked against the syllabus." render={(s) => (
          <>
            <span className="t-code w-24 shrink-0">{s.code}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.9375rem]">{s.name}</span><span className="t-meta">{where(s)}</span></span>
          </>
        )} />
      </Card>

      <Card title="Community contributions">
        <p className="t-small max-w-prose">
          No submission queue is connected yet; currently only developers upload.
        </p>
      </Card>
    </div>
  );
}
