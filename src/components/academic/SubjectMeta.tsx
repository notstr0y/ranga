import { Badge } from "../ui/Badge";
import { courseTypeLabel, formatCredits } from "../../utils/format";
import type { VerificationStatus } from "../../types";

interface Props {
  category: string | null;
  type: string | null;
  credits: number | null;
  slot?: string | null;
  status?: VerificationStatus;
}

/** Clean, separated course metadata — never raw concatenated values. Category as a tag, the rest as quiet text. */
export function SubjectMeta({ category, type, credits, slot, status }: Props) {
  const typeLabel = courseTypeLabel(type);
  const creditLabel = credits === null ? (category === "MNC" ? "Non-credit" : null) : formatCredits(credits);
  const text = [typeLabel, creditLabel, slot ? `Slot ${slot}` : null].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {category && <Badge>{category}</Badge>}
      {text && <span className="t-meta">{text}</span>}
      {status === "needs_review" && (
        <Badge tone="warn" title="This entry is awaiting verification against the official KTU curriculum.">Unverified</Badge>
      )}
    </div>
  );
}
