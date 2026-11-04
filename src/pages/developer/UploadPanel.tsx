import { useRef, useState, type FormEvent } from "react";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { UploadIcon } from "../../components/ui/icons";
import { useAsync } from "../../hooks/useAsync";
import { listProgrammes, listSchemes, listSemesters, listSubjects, uploadResource } from "../../lib/developerApi";
import type { ResourceType } from "../../types";
import { EXAM_TYPE_OPTIONS, RESOURCE_TYPES, isQuestionPaper } from "../../utils/format";
import { Card, Field, Notice, TextInput, inputCls } from "./shared";

const MAX_MB = 25;

/** Opening Upload from a check pre-selects where the file belongs. */
export interface Prefill { programmeId: string; schemeId: string; semesterId: string; subjectId: string; type?: ResourceType }

export function UploadPanel({ prefill }: { prefill?: Prefill }) {
  const toast = useToast();
  const [programmeId, setProgrammeId] = useState(prefill?.programmeId ?? "");
  const [schemeId, setSchemeId] = useState(prefill?.schemeId ?? "");
  const [semesterId, setSemesterId] = useState(prefill?.semesterId ?? "");
  const [subjectId, setSubjectId] = useState(prefill?.subjectId ?? "");
  const [type, setType] = useState<ResourceType | "">(prefill?.type ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [examType, setExamType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const programmes = useAsync(listProgrammes, []);
  const schemes = useAsync(() => listSchemes(programmeId), [programmeId], !!programmeId);
  const semesters = useAsync(() => listSemesters(schemeId), [schemeId], !!schemeId);
  const subjects = useAsync(() => listSubjects(semesterId), [semesterId], !!semesterId);
  const paper = isQuestionPaper(type);

  function fail(text: string) { setMsg({ tone: "error", text }); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return; // no double submit
    setMsg(null);
    if (!subjectId) return fail("Choose programme, scheme, semester and subject first.");
    if (!type) return fail("Choose a resource category.");
    if (title.trim().length < 3) return fail("Enter a title (at least 3 characters).");
    const y = Number(year);
    if (paper && (!Number.isInteger(y) || y < 2000 || y > new Date().getFullYear() + 1)) return fail("Question papers need a valid year, e.g. 2023.");
    if (!file) return fail("Choose a PDF file.");
    if (file.size > MAX_MB * 1024 * 1024) return fail(`That file is larger than ${MAX_MB} MB.`);
    // quick client-side check for a better message; the server re-checks the real PDF signature
    const head = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    if (head !== "%PDF-") return fail("That doesn't look like a PDF file.");

    const form = new FormData();
    form.set("subject_id", subjectId);
    form.set("resource_type", type);
    form.set("title", title.trim());
    if (description.trim()) form.set("description", description.trim());
    if (paper) { form.set("academic_year", String(y)); if (session.trim()) form.set("exam_session", session.trim()); if (examType) form.set("exam_type", examType); }
    form.set("file", file);

    setBusy(true);
    try {
      const res = await uploadResource(form);
      if (!res.ok) return fail(res.message ?? "Upload failed.");
      toast(res.duplicate ? "This exact file is already in the library — nothing new was created." : "Uploaded and published.");
      setTitle(""); setDescription(""); setYear(""); setSession(""); setExamType(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      fail(err instanceof Error ? err.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  const subject = subjects.data?.find((s) => s.id === subjectId);

  return (
    <Card title="Upload a PDF">
      <form onSubmit={onSubmit} className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Select label="1 · Programme" value={programmeId} onChange={(e) => { setProgrammeId(e.target.value); setSchemeId(""); setSemesterId(""); setSubjectId(""); }}>
          <option value="">Choose programme</option>
          {programmes.data?.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </Select>
        <Select label="2 · Scheme" value={schemeId} disabled={!programmeId} onChange={(e) => { setSchemeId(e.target.value); setSemesterId(""); setSubjectId(""); }}>
          <option value="">Choose scheme</option>
          {schemes.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select label="3 · Semester" value={semesterId} disabled={!schemeId} onChange={(e) => { setSemesterId(e.target.value); setSubjectId(""); }}>
          <option value="">Choose semester</option>
          {semesters.data?.map((s) => <option key={s.id} value={s.id}>S{s.semester_number}</option>)}
        </Select>
        <Select label="4 · Subject" value={subjectId} disabled={!semesterId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">{semesterId && subjects.loading ? "Loading…" : "Choose subject"}</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </Select>

        <Select label="5 · Category" value={type} onChange={(e) => { setType(e.target.value as ResourceType | ""); setYear(""); setSession(""); setExamType(""); }}>
          <option value="">Choose category</option>
          {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        {paper && (
          <Field label="Year" hint="Examination year, required for question papers">
            <TextInput value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" maxLength={4} placeholder="2023" />
          </Field>
        )}

        <div className="sm:col-span-2">
          <Field label="Title" hint={subject && paper ? `e.g. ${subject.name} — December ${year || "2023"}` : undefined}>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </Field>
        </div>
        {paper && (
          <>
            <Field label="Session (optional)"><TextInput value={session} onChange={(e) => setSession(e.target.value)} placeholder="December" maxLength={40} /></Field>
            <Select label="Exam type (optional)" value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="">—</option>
              {EXAM_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </>
        )}
        <div className="sm:col-span-2">
          <Field label="Description (optional)">
            <textarea className={`${inputCls} h-28`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={`PDF file (max ${MAX_MB} MB)`}>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={`${inputCls} flex items-center !py-0 file:mr-4 file:h-full file:cursor-pointer file:border-0 file:border-r file:border-line-strong file:bg-paper file:px-4 file:text-sm file:font-medium file:text-ink`} />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:col-span-2">
          <div><Button type="submit" disabled={busy} aria-busy={busy}><UploadIcon size={16} /> {busy ? "Uploading…" : "Upload and publish"}</Button></div>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        </div>
      </form>
    </Card>
  );
}
