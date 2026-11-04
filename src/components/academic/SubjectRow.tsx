import { Link } from "react-router-dom";
import type { Subject } from "../../types";
import { ChevronIcon, FolderIcon } from "../ui/icons";
import { SubjectMeta } from "./SubjectMeta";

/**
 * Subject directory item:
 * Styled like a folder in a filesystem list, with outlined monochrome folder icon, code, course metadata, and file count.
 */
export function SubjectRow({ subject }: { subject: Subject }) {
  return (
    <Link
      to={`/subject/${subject.id}`}
      className="group flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-surface-container active:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/60 bg-surface text-on-surface-variant transition-colors group-hover:border-outline group-hover:text-on-surface">
        <FolderIcon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-xs font-bold text-on-surface-variant">{subject.code}</span>
          <span className="text-sm font-semibold text-on-surface leading-snug">{subject.name}</span>
        </div>
        <div className="mt-0.5">
          <SubjectMeta
            category={subject.course_category}
            type={subject.course_type}
            credits={subject.credits}
            slot={subject.course_slot}
            status={subject.verification_status}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs text-on-surface-variant">
          {subject.resource_count} {subject.resource_count === 1 ? "file" : "files"}
        </span>
        <ChevronIcon
          size={16}
          className="text-on-surface-variant/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-on-surface"
        />
      </div>
    </Link>
  );
}
