import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import rangaNoResources from "../assets/ranga/ranga-no-resources.webp";
import { SubjectMeta } from "../components/academic/SubjectMeta";
import { ResourceList, ResourceRow } from "../components/resources/ResourceRow";
import { TypeTabs } from "../components/resources/TypeTabs";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { PageHeader } from "../components/ui/PageHeader";
import { RowSkeletons } from "../components/ui/Skeleton";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState } from "../components/ui/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useTitle } from "../hooks/useTitle";
import { getSubject, getSubjectResources } from "../lib/api";
import type { ResourceType } from "../types";
import { resourceTypePlural } from "../utils/format";

/**
 * Subject view: resources presented in a clean file-manager layout.
 * When a subject has no resources: shows only the looping GIF (no headings or captions).
 */
export function SubjectPage() {
  const { id = "" } = useParams();
  return <SubjectView key={id} id={id} />;
}

function SubjectView({ id }: { id: string }) {
  const subject = useAsync(() => getSubject(id), [id]);
  const resources = useAsync(() => getSubjectResources(id), [id]);
  const [type, setType] = useState<ResourceType | undefined>();
  const [year, setYear] = useState("");
  useTitle(subject.data ? `${subject.data.code} ${subject.data.name}` : "Subject");

  const counts = useMemo(() => {
    const c: Partial<Record<ResourceType, number>> = {};
    for (const r of resources.data ?? []) c[r.resource_type] = (c[r.resource_type] ?? 0) + 1;
    return c;
  }, [resources.data]);

  // Year filter applies strictly to question papers
  const paperYears = useMemo(
    () =>
      [
        ...new Set(
          (resources.data ?? [])
            .filter((r) => r.resource_type === "pyq" && r.academic_year)
            .map((r) => r.academic_year as number)
        ),
      ].sort((a, b) => b - a),
    [resources.data]
  );

  const yearFilter = type === "pyq" && year && paperYears.includes(Number(year)) ? Number(year) : undefined;
  const shown = (resources.data ?? []).filter(
    (r) => (!type || r.resource_type === type) && (!yearFilter || r.academic_year === yearFilter)
  );

  if (subject.loading) return <RowSkeletons count={3} />;
  if (subject.error) {
    return subject.error.message.includes("couldn't find") ? (
      <EmptyState title="Subject not found" action={{ to: "/browse", label: "Back to browsing" }}>
        The link may be out of date.
      </EmptyState>
    ) : (
      <ErrorState message={subject.error.message} onRetry={subject.reload} />
    );
  }

  const s = subject.data!;
  const sem = s.semester,
    sch = sem.scheme,
    prog = sch.programme;
  const base = `/browse/${encodeURIComponent(prog.code)}`;
  const semPath = `${base}/${encodeURIComponent(sch.code)}/${sem.semester_number}`;

  const crumbs = [
    { label: prog.code, to: base },
    { label: `${sch.code} Scheme`, to: `${base}/${encodeURIComponent(sch.code)}` },
    { label: `Semester ${sem.semester_number}`, to: semPath },
    { label: s.code },
  ];

  // Strictly zero-resource state: show ONLY the GIF without headings, captions, or empty containers
  if (!resources.loading && !resources.error && !resources.data?.length) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-col items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-sm overflow-hidden rounded-lg bg-surface-container" style={{ aspectRatio: "498/282" }}>
            <img
              src={rangaNoResources}
              alt=""
              width={498}
              height={282}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
          <span className="sr-only">No resources available yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={crumbs} />

      <PageHeader
        kicker={s.code}
        title={s.name}
        subtitle={`${prog.name} · ${sch.name} · ${sem.name}`}
      />

      <div className="-mt-2 mb-6">
        <SubjectMeta
          category={s.course_category}
          type={s.course_type}
          credits={s.credits}
          slot={s.course_slot}
          status={s.verification_status}
        />
      </div>

      {resources.loading ? (
        <RowSkeletons count={3} />
      ) : resources.error ? (
        <ErrorState message={resources.error.message} onRetry={resources.reload} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TypeTabs
              value={type}
              onChange={(t) => {
                setType(t);
                setYear("");
              }}
              counts={counts}
            />

            {type === "pyq" && paperYears.length > 0 && (
              <div className="w-36">
                <Select label="Year" value={yearFilter ?? ""} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Any year</option>
                  {paperYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {shown.length ? (
            <ResourceList>
              {shown.map((r) => (
                <ResourceRow key={r.id} resource={r} showSubject={false} />
              ))}
            </ResourceList>
          ) : yearFilter ? (
            <EmptyState compact title={`No question papers for ${yearFilter}`}>
              Try selecting another year.
            </EmptyState>
          ) : (
            <EmptyState
              compact
              title={`No ${type ? resourceTypePlural(type).toLowerCase() : "resources"} for ${s.code} yet`}
            >
              {type === "pyq"
                ? "No question papers have been uploaded for this subject yet."
                : "Nothing in this category has been uploaded for this subject yet."}
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
}
