import { Link, useParams } from "react-router-dom";
import { ResourceViewer } from "../components/resources/ResourceViewer";
import { Breadcrumbs, type Crumb } from "../components/ui/Breadcrumbs";
import { RowSkeletons } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/StateViews";
import { ResourceTypeIcon } from "../components/ui/icons";
import { useAsync } from "../hooks/useAsync";
import { useTitle } from "../hooks/useTitle";
import { getResource } from "../lib/api";
import { examTypeLabel, formatBytes, resourceTypeLabel, semesterLabel } from "../utils/format";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-on-surface">{children}</dd>
    </div>
  );
}

export function ResourcePage() {
  const { id = "" } = useParams();
  const res = useAsync(() => getResource(id), [id]);
  useTitle(res.data?.title ?? "Resource");

  if (res.loading) return <RowSkeletons count={3} />;
  if (res.error) {
    return res.error.message.includes("couldn't find") ? (
      <EmptyState title="Resource not found" action={{ to: "/browse", label: "Browse the catalogue" }}>
        It may have been removed or unpublished.
      </EmptyState>
    ) : (
      <ErrorState message={res.error.message} onRetry={res.reload} />
    );
  }

  const r = res.data!;
  const isPaper = r.resource_type === "pyq";
  const size = formatBytes(r.file_size_bytes);
  const examDetail = [r.exam_session, examTypeLabel(r.exam_type)].filter(Boolean).join(" · ");

  // Programmes → programme → scheme → semester → subject → this resource
  const crumbs: Crumb[] = [{ label: "Programmes", to: "/browse" }];
  if (r.programme_code) {
    const base = `/browse/${encodeURIComponent(r.programme_code)}`;
    crumbs.push({ label: r.programme_code, to: base });
    if (r.scheme_code) {
      crumbs.push({ label: `${r.scheme_code} Scheme`, to: `${base}/${encodeURIComponent(r.scheme_code)}` });
      if (r.semester_number) {
        crumbs.push({
          label: `Semester ${r.semester_number}`,
          to: `${base}/${encodeURIComponent(r.scheme_code)}/${r.semester_number}`,
        });
      }
    }
  }
  if (r.subject_code && r.subject_id) {
    crumbs.push({ label: r.subject_code, to: `/subject/${r.subject_id}` });
  }
  crumbs.push({ label: r.title });

  return (
    <article>
      <Breadcrumbs items={crumbs} />

      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="flex size-6 items-center justify-center rounded border border-outline-variant bg-surface">
            <ResourceTypeIcon type={r.resource_type} size={14} />
          </span>
          <span className="font-semibold text-on-surface">{resourceTypeLabel(r.resource_type)}</span>
          {isPaper && r.academic_year && (
            <>
              <span>•</span>
              <span className="font-mono">{r.academic_year}</span>
            </>
          )}
          {size && (
            <>
              <span>•</span>
              <span className="font-mono">{size}</span>
            </>
          )}
        </div>

        <h1 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl max-w-3xl">{r.title}</h1>
      </header>

      <section
        aria-label="Download and preview options"
        className="mb-8 rounded-lg border border-outline-variant bg-surface p-5 sm:p-6"
      >
        <ResourceViewer resource={r} />
      </section>

      {r.description && (
        <div className="mb-8 rounded-lg border border-outline-variant bg-surface p-5">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Description</h2>
          <p className="whitespace-pre-line text-sm text-on-surface leading-relaxed">{r.description}</p>
        </div>
      )}

      <section aria-labelledby="facts-h">
        <h2 id="facts-h" className="mb-3 text-sm font-semibold tracking-tight text-on-surface">
          File Details
        </h2>
        <div className="rounded-lg border border-outline-variant bg-surface p-5">
          <dl className="divide-y divide-outline-variant">
            <Fact label="Subject">
              {r.subject_id ? (
                <Link to={`/subject/${r.subject_id}`} className="hover:underline transition-colors">
                  <span className="mr-2 font-mono font-bold text-on-surface">{r.subject_code}</span>
                  {r.subject_name}
                </Link>
              ) : (
                <span className="text-on-surface-variant/60">—</span>
              )}
            </Fact>
            <Fact label="Programme">{r.programme_name ?? <span className="text-on-surface-variant/60">—</span>}</Fact>
            <Fact label="Scheme">{r.scheme_name ?? <span className="text-on-surface-variant/60">—</span>}</Fact>
            <Fact label="Semester">{r.semester_number ? semesterLabel(r.semester_number) : <span className="text-on-surface-variant/60">—</span>}</Fact>
            {isPaper && (
              <Fact label="Year">
                <span className="font-mono">{r.academic_year ?? <span className="text-on-surface-variant/60">—</span>}</span>
              </Fact>
            )}
            {isPaper && examDetail && <Fact label="Exam">{examDetail}</Fact>}
            <Fact label="File">{[r.file_name, size].filter(Boolean).join(" · ") || "PDF"}</Fact>
          </dl>
        </div>
      </section>
    </article>
  );
}
