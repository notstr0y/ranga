import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import { AddIcon, DeleteIcon, EditIcon } from "../../components/ui/icons";
import { useAsync } from "../../hooks/useAsync";
import {
  createSemesters, deleteProgramme, deleteScheme, deleteSemester, deleteSubject, listProgrammes, listSchemes,
  listSemesters, listSubjects, saveProgramme, saveScheme, saveSubject,
  type DevProgramme, type DevScheme, type DevSubject, type SubjectForm,
} from "../../lib/developerApi";
import type { VerificationStatus } from "../../types";
import { Card, Field, Notice, TextInput, VERIFICATION_OPTIONS } from "./shared";

type Msg = { tone: "ok" | "error"; text: string } | null;

/** Runs a write: success is a toast and a reload, failure stays inline next to the form. Deletions always ask first. */
function useAction(onDone: () => void) {
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();
  async function run(fn: () => Promise<unknown>, okText: string, confirmText?: string) {
    if (confirmText && !(await confirm({ title: "Are you sure?", body: confirmText, confirmLabel: "Delete", tone: "danger" }))) return false;
    setBusy(true); setMsg(null);
    try { await fn(); if (okText) toast(okText); onDone(); return true; }
    catch (e) { setMsg({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong." }); return false; }
    finally { setBusy(false); }
  }
  return { msg, busy, run };
}

const row = "flex items-center justify-between gap-3 border-b border-line py-3 last:border-0";
const iconBtn = "flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-40";

export function CataloguePanel() {
  const programmes = useAsync(listProgrammes, []);
  const [programmeId, setProgrammeId] = useState("");
  const [schemeId, setSchemeId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const schemes = useAsync(() => listSchemes(programmeId), [programmeId], !!programmeId);
  const semesters = useAsync(() => listSemesters(schemeId), [schemeId], !!schemeId);
  const subjects = useAsync(() => listSubjects(semesterId), [semesterId], !!semesterId);

  return (
    <div className="space-y-5">
      <ProgrammesCard
        programmes={programmes.data ?? []} selected={programmeId}
        onSelect={(id) => { setProgrammeId(id); setSchemeId(""); setSemesterId(""); }}
        reload={programmes.reload}
        onDeleted={(id) => { if (id === programmeId) { setProgrammeId(""); setSchemeId(""); setSemesterId(""); } }}
      />
      {programmeId && (
        <SchemesCard
          programmeId={programmeId} schemes={schemes.data ?? []} selected={schemeId} reload={schemes.reload}
          onSelect={(id) => { setSchemeId(id); setSemesterId(""); }}
          onDeleted={(id) => { if (id === schemeId) { setSchemeId(""); setSemesterId(""); } }}
        />
      )}
      {schemeId && (
        <SemestersCard
          schemeId={schemeId} semesters={semesters.data ?? []} selected={semesterId} reload={semesters.reload}
          onSelect={setSemesterId} onDeleted={(id) => { if (id === semesterId) setSemesterId(""); }}
        />
      )}
      {semesterId && <SubjectsCard semesterId={semesterId} subjects={subjects.data ?? []} loading={subjects.loading} reload={subjects.reload} />}
    </div>
  );
}

// ---------------- programmes ----------------
function ProgrammesCard({ programmes, selected, onSelect, reload, onDeleted }: {
  programmes: DevProgramme[]; selected: string; onSelect: (id: string) => void; reload: () => void; onDeleted: (id: string) => void;
}) {
  const { msg, busy, run } = useAction(reload);
  const [edit, setEdit] = useState<DevProgramme | null>(null);
  const [f, setF] = useState({ code: "", name: "", degree: "B.Tech", sort: "" });

  function startEdit(p: DevProgramme) { setEdit(p); setF({ code: p.code, name: p.name, degree: p.degree, sort: p.sort_order?.toString() ?? "" }); }
  function reset() { setEdit(null); setF({ code: "", name: "", degree: "B.Tech", sort: "" }); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[A-Za-z0-9-]{2,12}$/.test(f.code.trim())) { return void run(() => Promise.reject(new Error("Programme code: 2–12 letters, digits or dashes (e.g. CSE).")), ""); }
    if (f.name.trim().length < 3) { return void run(() => Promise.reject(new Error("Enter the programme name.")), ""); }
    const ok = await run(() => saveProgramme({ id: edit?.id, code: f.code, name: f.name, degree: f.degree, sort_order: f.sort ? Number(f.sort) : null, is_active: edit?.is_active ?? true }), edit ? "Programme updated." : "Programme added.");
    if (ok) reset();
  }

  return (
    <Card title="Programmes">
      <div>
        {programmes.map((p) => (
          <div key={p.id} className={row}>
            <button type="button" onClick={() => onSelect(p.id)} className={`min-w-0 flex-1 text-left ${selected === p.id ? "font-medium text-ink" : "text-muted hover:text-ink"}`}>
              <span className="t-code mr-2">{p.code}</span>{p.name}
            </button>
            <button type="button" aria-label={`Edit ${p.code}`} className={iconBtn} onClick={() => startEdit(p)}><EditIcon size={16} /></button>
            <button type="button" aria-label={`Delete ${p.code}`} className={iconBtn} disabled={busy}
              onClick={() => void run(async () => { await deleteProgramme(p.id); onDeleted(p.id); }, "Programme deleted.", `Delete programme ${p.code}? This only works if it has no schemes.`)}><DeleteIcon size={16} /></button>
          </div>
        ))}
        {!programmes.length && <p className="t-small py-2">No programmes yet.</p>}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-4">
        <Field label="Code"><TextInput value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="ECE" maxLength={12} /></Field>
        <div className="sm:col-span-2"><Field label="Name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Electronics and Communication Engineering" /></Field></div>
        <Field label="Order"><TextInput value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} inputMode="numeric" placeholder="20" /></Field>
        <div className="flex gap-2 sm:col-span-4">
          <Button type="submit" disabled={busy}><AddIcon size={16} /> {edit ? "Save programme" : "Add programme"}</Button>
          {edit && <Button variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
      </form>
      {msg && msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  );
}

// ---------------- schemes ----------------
function SchemesCard({ programmeId, schemes, selected, onSelect, reload, onDeleted }: {
  programmeId: string; schemes: DevScheme[]; selected: string; onSelect: (id: string) => void; reload: () => void; onDeleted: (id: string) => void;
}) {
  const { msg, busy, run } = useAction(reload);
  const blank = { code: "", name: "", source_url: "", verification_status: "needs_review" as VerificationStatus };
  const [edit, setEdit] = useState<DevScheme | null>(null);
  const [f, setF] = useState(blank);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(f.code.trim())) return void run(() => Promise.reject(new Error("Scheme code should be a year such as 2019 or 2024.")), "");
    const ok = await run(() => saveScheme(programmeId, { id: edit?.id, ...f }), edit ? "Scheme updated." : "Scheme added.");
    if (ok) { setEdit(null); setF(blank); }
  }

  return (
    <Card title="Schemes">
      <div>
        {schemes.map((s) => (
          <div key={s.id} className={row}>
            <button type="button" onClick={() => onSelect(s.id)} className={`min-w-0 flex-1 text-left ${selected === s.id ? "font-medium text-ink" : "text-muted hover:text-ink"}`}>
              <span className="t-code mr-2">{s.code}</span>{s.name}
            </button>
            <button type="button" aria-label={`Edit scheme ${s.code}`} className={iconBtn} onClick={() => { setEdit(s); setF({ code: s.code, name: s.name, source_url: s.source_url ?? "", verification_status: s.verification_status }); }}><EditIcon size={16} /></button>
            <button type="button" aria-label={`Delete scheme ${s.code}`} className={iconBtn} disabled={busy}
              onClick={() => void run(async () => { await deleteScheme(s.id); onDeleted(s.id); }, "Scheme deleted.", `Delete scheme ${s.code}? Only possible when it has no semesters.`)}><DeleteIcon size={16} /></button>
          </div>
        ))}
        {!schemes.length && <p className="t-small py-2">No schemes for this programme yet.</p>}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field label="Scheme (year)"><TextInput value={f.code} disabled={!!edit} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="2024" maxLength={4} inputMode="numeric" /></Field>
        <Field label="Name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="2024 Scheme" /></Field>
        <Field label="Source URL / reference"><TextInput value={f.source_url} onChange={(e) => setF({ ...f, source_url: e.target.value })} placeholder="https://…" /></Field>
        <Select label="Verification" value={f.verification_status} onChange={(e) => setF({ ...f, verification_status: e.target.value as VerificationStatus })}>
          {VERIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy}><AddIcon size={16} /> {edit ? "Save scheme" : "Add scheme"}</Button>
          {edit && <Button variant="ghost" onClick={() => { setEdit(null); setF(blank); }}>Cancel</Button>}
        </div>
      </form>
      {msg && msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  );
}

// ---------------- semesters ----------------
function SemestersCard({ schemeId, semesters, selected, onSelect, reload, onDeleted }: {
  schemeId: string; semesters: { id: string; semester_number: number }[]; selected: string; onSelect: (id: string) => void; reload: () => void; onDeleted: (id: string) => void;
}) {
  const { msg, busy, run } = useAction(reload);
  const have = new Set(semesters.map((s) => s.semester_number));
  const missing = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !have.has(n));

  return (
    <Card title="Semesters" action={missing.length ? <Button variant="outline" disabled={busy} onClick={() => void run(() => createSemesters(schemeId, missing), `Created ${missing.map((n) => `S${n}`).join(", ")}.`)}><AddIcon size={16} /> Create missing ({missing.length})</Button> : undefined}>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {semesters.map((s) => (
          <div key={s.id} className="relative">
            <button type="button" onClick={() => onSelect(s.id)} className={`flex min-h-12 w-full items-center justify-center rounded-md border font-mono ${selected === s.id ? "border-ink bg-paper-2" : "border-line text-muted hover:border-line-strong hover:text-ink"}`}>S{s.semester_number}</button>
            <button type="button" aria-label={`Delete S${s.semester_number}`} disabled={busy} className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-line bg-card text-muted hover:border-ink hover:text-ink"
              onClick={() => void run(async () => { await deleteSemester(s.id); onDeleted(s.id); }, `S${s.semester_number} deleted.`, `Delete S${s.semester_number}? Only possible when it has no subjects.`)}><DeleteIcon size={12} /></button>
          </div>
        ))}
      </div>
      {!semesters.length && <p className="t-small">No semesters yet — use “Create missing”.</p>}
      {msg && msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  );
}

// ---------------- subjects ----------------
const COURSE_TYPES = ["theory", "lab", "workshop", "elective", "project", "other"];
const blankSubject: SubjectForm = { code: "", name: "", course_type: "theory", course_category: "", credits: "", course_slot: "", source_url: "", verification_status: "needs_review" };

function SubjectsCard({ semesterId, subjects, loading, reload }: { semesterId: string; subjects: DevSubject[]; loading: boolean; reload: () => void }) {
  const { msg, busy, run } = useAction(reload);
  const [f, setF] = useState<SubjectForm>(blankSubject);
  const editing = !!f.id;

  function startEdit(s: DevSubject) {
    setF({ id: s.id, code: s.code, name: s.name, course_type: s.course_type ?? "theory", course_category: s.course_category ?? "", credits: s.credits?.toString() ?? "", course_slot: s.course_slot ?? "", source_url: s.source_url ?? "", verification_status: s.verification_status });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[A-Za-z0-9]{4,12}$/.test(f.code.trim())) return void run(() => Promise.reject(new Error("Subject code: 4–12 letters/digits, exactly as printed by KTU (no spaces).")), "");
    if (f.name.trim().length < 3) return void run(() => Promise.reject(new Error("Enter the official subject name.")), "");
    if (!editing && subjects.some((s) => s.code.toUpperCase() === f.code.trim().toUpperCase())) return void run(() => Promise.reject(new Error(`${f.code.trim().toUpperCase()} already exists in this semester.`)), "");
    const ok = await run(() => saveSubject(semesterId, f), editing ? "Subject updated." : "Subject added.");
    if (ok) setF(blankSubject);
  }

  return (
    <Card title={`Subjects${subjects.length ? ` (${subjects.length})` : ""}`}>
      {loading && !subjects.length ? <p className="t-small">Loading…</p> : (
        <div>
          {subjects.map((s) => (
            <div key={s.id} className={row}>
              <span className="min-w-0 flex-1">
                <span className="t-code mr-2">{s.code}</span>{s.name}
                <span className="t-meta ml-2">{[s.course_category, s.credits !== null ? `${s.credits} cr` : null, s.verification_status === "needs_review" ? "unverified" : null].filter(Boolean).join(" · ")}</span>
              </span>
              <button type="button" aria-label={`Edit ${s.code}`} className={iconBtn} onClick={() => startEdit(s)}><EditIcon size={16} /></button>
              <button type="button" aria-label={`Delete ${s.code}`} className={iconBtn} disabled={busy}
                onClick={() => void run(() => deleteSubject(s.id), "Subject deleted.", `Delete ${s.code} — ${s.name}? Only possible when it has no resources.`)}><DeleteIcon size={16} /></button>
            </div>
          ))}
          {!subjects.length && <p className="t-small py-2">No subjects in this semester yet.</p>}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-x-4 gap-y-5 border-t border-line pt-6 sm:grid-cols-6">
        <div className="sm:col-span-2"><Field label="Subject code" hint={editing ? "Code can't be changed; delete and re-add instead." : "As printed by KTU, e.g. PCCST402"}><TextInput value={f.code} disabled={editing} onChange={(e) => setF({ ...f, code: e.target.value })} maxLength={12} /></Field></div>
        <div className="sm:col-span-4"><Field label="Official subject name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Select label="Course type" value={f.course_type} onChange={(e) => setF({ ...f, course_type: e.target.value })}>{COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
        <div className="sm:col-span-2"><Field label="Category" hint="PC, BSC, ESC, PE, HMC…"><TextInput value={f.course_category} onChange={(e) => setF({ ...f, course_category: e.target.value })} maxLength={8} /></Field></div>
        <Field label="Credits"><TextInput value={f.credits} onChange={(e) => setF({ ...f, credits: e.target.value })} inputMode="decimal" placeholder="—" /></Field>
        <Field label="Slot"><TextInput value={f.course_slot} onChange={(e) => setF({ ...f, course_slot: e.target.value })} maxLength={8} /></Field>
        <div className="sm:col-span-4"><Field label="Source URL / reference"><TextInput value={f.source_url} onChange={(e) => setF({ ...f, source_url: e.target.value })} placeholder="https://…" /></Field></div>
        <div className="sm:col-span-2">
          <Select label="Verification" value={f.verification_status} onChange={(e) => setF({ ...f, verification_status: e.target.value as VerificationStatus })}>
            {VERIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <Button type="submit" disabled={busy}><AddIcon size={16} /> {editing ? "Save subject" : "Add subject"}</Button>
          {editing && <Button variant="ghost" onClick={() => setF(blankSubject)}>Cancel</Button>}
        </div>
      </form>
      {msg && msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  );
}
