import { useAsync } from "../../hooks/useAsync";
import { getProgrammes, getResourceYears, getSchemeCodes } from "../../lib/api";
import type { SearchFilters } from "../../types";
import { RESOURCE_TYPES, isQuestionPaper } from "../../utils/format";
import { Select } from "../ui/Select";

interface Props {
  filters: SearchFilters;
  onChange: (patch: Partial<Record<keyof SearchFilters, string | number | undefined>>) => void;
  showType?: boolean;
}

export function ResourceFilters({ filters, onChange, showType }: Props) {
  const programmes = useAsync(getProgrammes, []);
  const schemes = useAsync(getSchemeCodes, []);
  // the year list is only fetched (and the control only shown) for question papers
  const pyq = isQuestionPaper(filters.type);
  const years = useAsync(getResourceYears, [], pyq);
  // a year that arrived through a shared link is always listed, so the control never shows "Any year" while one is applied
  const yearList = [...new Set([...(years.data ?? []), ...(filters.year ? [filters.year] : [])])].sort((a, b) => b - a);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr_1fr]">
      <Select label="Programme" value={filters.programme ?? ""} onChange={(e) => onChange({ programme: e.target.value })}>
        <option value="">All</option>
        {programmes.data?.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}
      </Select>
      <Select label="Scheme" value={filters.scheme ?? ""} onChange={(e) => onChange({ scheme: e.target.value })}>
        <option value="">All</option>
        {schemes.data?.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Select label="Semester" value={filters.semester ?? ""} onChange={(e) => onChange({ semester: e.target.value })}>
        <option value="">All</option>
        {Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>S{i + 1}</option>)}
      </Select>
      {showType && (
        <Select label="Category" value={filters.type ?? ""} onChange={(e) => onChange({ type: e.target.value, year: undefined })}>
          <option value="">All</option>
          {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.plural}</option>)}
        </Select>
      )}
      {pyq && (
        <Select label="Year" value={filters.year ?? ""} onChange={(e) => onChange({ year: e.target.value })}>
          <option value="">Any year</option>
          {yearList.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      )}
    </div>
  );
}
