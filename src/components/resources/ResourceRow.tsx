import { Link } from "react-router-dom";
import type { Resource } from "../../types";
import { examTypeLabel, formatBytes, relativeTime, resourceTypeLabel, semesterLabel } from "../../utils/format";
import { ChevronIcon, ResourceTypeIcon } from "../ui/icons";

export function ResourceRow({ resource: r, showSubject = true }: { resource: Resource; showSubject?: boolean }) {
  const examDetail = r.resource_type === "pyq" ? [r.exam_session, examTypeLabel(r.exam_type)].filter(Boolean).join(" · ") : "";
  const size = formatBytes(r.file_size_bytes);
  const where = [r.programme_code, r.scheme_code, r.semester_number ? semesterLabel(r.semester_number) : null].filter(Boolean).join(" · ");

  return (
    <Link
      to={`/resources/${r.id}`}
      className="group flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-surface-container active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/60 bg-surface text-on-surface-variant transition-colors group-hover:border-outline group-hover:text-on-surface">
        <ResourceTypeIcon type={r.resource_type} size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-on-surface leading-snug">{r.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant">
          {showSubject && r.subject_code && (
            <span className="font-mono text-[0.6875rem] font-bold text-on-surface">
              {r.subject_code}
            </span>
          )}
          <span>{resourceTypeLabel(r.resource_type)}</span>
          {r.resource_type === "pyq" && r.academic_year && (
            <span className="font-mono text-[0.6875rem] font-semibold text-on-surface">
              {r.academic_year}
            </span>
          )}
          {examDetail && <span className="text-on-surface-variant/70">{examDetail}</span>}
          {size && <span className="text-on-surface-variant/70 font-mono text-[0.6875rem]">{size}</span>}
        </span>
        {where && <span className="mt-0.5 block text-[0.6875rem] text-on-surface-variant/60">{where}</span>}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-on-surface-variant sm:block">{relativeTime(r.created_at)}</span>
        <ChevronIcon
          size={16}
          className="text-on-surface-variant/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-on-surface"
        />
      </span>
    </Link>
  );
}

export function ResourceList({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface divide-y divide-outline-variant">
      {children}
    </div>
  );
}
