import { EmptyState } from "../components/ui/StateViews";
import { useTitle } from "../hooks/useTitle";

export function NotFoundPage() {
  useTitle("Page Not Found");
  return (
    <EmptyState
      title="Page not found"
      action={{ to: "/", label: "Back to catalogue" }}
    >
      That page doesn't exist — the link may be out of date.
    </EmptyState>
  );
}
