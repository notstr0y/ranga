import type { Programme } from "../../types";
import { FolderCard } from "./FolderCard";

/** Academic Programmes rendered as file-manager folders in a clean grid. */
export function ProgrammeGrid({ programmes }: { programmes: Programme[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {programmes.map((p) => (
        <FolderCard
          key={p.id}
          to={`/browse/${encodeURIComponent(p.code)}`}
          name={p.name}
          code={p.code}
          meta={p.degree}
          variant="programme"
        />
      ))}
    </div>
  );
}
