import { useParams } from "react-router-dom";
import { FolderCard } from "../components/academic/FolderCard";
import { ProgrammeGrid } from "../components/academic/ProgrammeGrid";
import { SubjectRow } from "../components/academic/SubjectRow";
import { Badge } from "../components/ui/Badge";
import { Breadcrumbs, type Crumb } from "../components/ui/Breadcrumbs";
import { PageHeader } from "../components/ui/PageHeader";
import { CardGridSkeleton, RowSkeletons } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useTitle } from "../hooks/useTitle";
import { getProgrammes, getSchemes, getSemesters, getSemesterSubjects } from "../lib/api";

/**
 * Minimal file-manager academic resource navigation:
 * Programme Folder → Scheme Folder → Semester Folder → Subject Folder
 * / · /browse · /browse/:programme · /browse/:programme/:scheme · /browse/:programme/:scheme/:semester
 */
export function BrowsePage() {
  const { programme: pCode, scheme: sCode, semester: semParam } = useParams();
  const semNum = semParam ? Number(semParam) : undefined;

  const programmes = useAsync(getProgrammes, []);
  const programme = programmes.data?.find((p) => p.code === pCode);
  const schemes = useAsync(() => getSchemes(programme!.id), [programme?.id], !!programme);
  const scheme = schemes.data?.find((s) => s.code === sCode);
  const semesters = useAsync(() => getSemesters(scheme!.id), [scheme?.id], !!scheme);
  const semester = semesters.data?.find((s) => s.semester_number === semNum);
  const subjects = useAsync(() => getSemesterSubjects(semester!.id), [semester?.id], !!semester);

  const crumbs: Crumb[] = [{ label: "Programmes", to: "/browse" }];
  if (pCode) crumbs.push({ label: pCode, to: `/browse/${encodeURIComponent(pCode)}` });
  if (sCode) crumbs.push({ label: `${sCode} Scheme`, to: `/browse/${encodeURIComponent(pCode!)}/${encodeURIComponent(sCode)}` });
  if (semNum) crumbs.push({ label: `Semester ${semNum}` });

  const title = semNum ? `Semester ${semNum}` : sCode ? `${sCode} Scheme` : pCode ?? "Academic Resources";
  useTitle(pCode ? `${[pCode, sCode, semNum && `Semester ${semNum}`].filter(Boolean).join(" · ")}` : "Academic Resources");

  // ---- level 0: all programmes
  if (!pCode) {
    return (
      <div>
        <PageHeader
          title="Programmes"
          subtitle="Select a programme folder to browse curriculum schemes, semesters, and subjects."
        />
        {programmes.loading ? (
          <RowSkeletons count={3} />
        ) : programmes.error ? (
          <ErrorState message={programmes.error.message} onRetry={programmes.reload} />
        ) : programmes.data?.length ? (
          <ProgrammeGrid programmes={programmes.data} />
        ) : (
          <EmptyState title="No programmes available yet">
            The academic catalogue hasn't been loaded yet.
          </EmptyState>
        )}
      </div>
    );
  }

  // ---- deeper directory levels: wait for / validate the trail
  const trailLoading = programmes.loading || (!!programme && schemes.loading) || (!!scheme && semesters.loading);
  const trailError = programmes.error ?? schemes.error ?? semesters.error;
  const reloadTrail = () => {
    programmes.reload();
    if (programme) schemes.reload();
    if (scheme) semesters.reload();
  };

  if (trailError) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <ErrorState message={trailError.message} onRetry={reloadTrail} />
      </div>
    );
  }
  if (trailLoading && !(programme && (!sCode || scheme))) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <RowSkeletons count={4} />
      </div>
    );
  }
  const missing = !programme ? "programme" : sCode && !scheme ? "scheme" : semNum && !semester && !semesters.loading ? "semester" : null;
  if (missing) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <EmptyState title={`We couldn't find that ${missing}`} action={{ to: "/browse", label: "Back to browsing" }}>
          The link may be out of date.
        </EmptyState>
      </div>
    );
  }

  // ---- level 1: a programme's schemes
  if (!sCode) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <PageHeader
          kicker={programme!.degree}
          title={programme!.name}
          subtitle={`Curriculum schemes available for ${programme!.code}.`}
        />
        {schemes.loading ? (
          <RowSkeletons count={2} />
        ) : schemes.data?.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {schemes.data.map((s) => (
              <FolderCard
                key={s.id}
                to={`/browse/${encodeURIComponent(programme!.code)}/${encodeURIComponent(s.code)}`}
                code={s.code}
                name={s.name.includes("Scheme") ? s.name : `${s.name} Scheme`}
                variant="scheme"
                badge={s.verification_status === "needs_review" ? <Badge tone="warn">Unverified</Badge> : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No schemes added yet" action={{ to: "/browse", label: "Back to browsing" }}>
            This programme's schemes are still being added.
          </EmptyState>
        )}
      </div>
    );
  }

  // ---- level 2: a scheme's semesters
  if (!semNum) {
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <PageHeader
          kicker={programme!.code}
          title={`${scheme!.name}`}
          subtitle="Select a semester folder to view subject modules."
        />
        {semesters.loading ? (
          <CardGridSkeleton count={8} />
        ) : semesters.data?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {semesters.data.map((s) => (
              <FolderCard
                key={s.id}
                to={`/browse/${encodeURIComponent(programme!.code)}/${encodeURIComponent(scheme!.code)}/${s.semester_number}`}
                code={`S${s.semester_number}`}
                name={`Semester ${s.semester_number}`}
                variant="semester"
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No semesters added yet" action={{ to: `/browse/${encodeURIComponent(programme!.code)}`, label: "Back to schemes" }}>
            This scheme's semesters are still being added.
          </EmptyState>
        )}
      </div>
    );
  }

  // ---- level 3: a semester's subjects
  return (
    <div>
      <Breadcrumbs items={crumbs} />
      <PageHeader
        kicker={`${programme!.code} · ${scheme!.code}`}
        title={title}
        subtitle={
          subjects.data
            ? `${subjects.data.length} ${subjects.data.length === 1 ? "subject folder" : "subject folders"}`
            : undefined
        }
      />
      {subjects.loading ? (
        <RowSkeletons count={6} />
      ) : subjects.error ? (
        <ErrorState message={subjects.error.message} onRetry={subjects.reload} />
      ) : subjects.data?.length ? (
        <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface divide-y divide-outline-variant">
          {subjects.data.map((s) => (
            <SubjectRow key={s.id} subject={s} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No subjects available yet"
          action={{
            to: `/browse/${encodeURIComponent(programme!.code)}/${encodeURIComponent(scheme!.code)}`,
            label: "Pick another semester",
          }}
        >
          This semester's subject list hasn't been added yet.
        </EmptyState>
      )}
    </div>
  );
}
