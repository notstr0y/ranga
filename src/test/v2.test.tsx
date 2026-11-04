import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const check = vi.fn(async () => false);
vi.mock("../hooks/useConnectivity", () => ({
  useConnectivity: () => ({ online: false, checking: false, failedRetry: false, check }),
}));
vi.mock("../lib/api", () => ({
  getProgrammes: async () => [{ id: "p1", code: "CSE", name: "Computer Science and Engineering" }],
  getSchemeCodes: async () => ["2019", "2024"],
  getResourceYears: vi.fn(async () => [2024, 2023]),
  getSubject: async () => ({
    id: "s1", code: "PCCST402", name: "Database Management Systems", course_type: "theory", course_category: "PC", credits: 4, course_slot: "B", verification_status: "verified_secondary",
    semester: { id: "m", semester_number: 4, name: "Semester 4", scheme: { id: "c", code: "2024", name: "2024 Scheme", programme: { id: "p1", code: "CSE", name: "Computer Science and Engineering" } } },
  }),
  getSubjectResources: vi.fn(),
}));

import * as api from "../lib/api";
import { OfflineScreen } from "../components/brand/OfflineScreen";
import { WelcomeOverlay } from "../components/brand/WelcomeOverlay";
import { InteractiveWordmark } from "../components/brand/InteractiveWordmark";
import { ResourceFilters } from "../components/resources/ResourceFilters";
import { SubjectPage } from "../pages/SubjectPage";
import { EmptyState } from "../components/ui/StateViews";
import { RANGA_EMPTY_DIALOGUE } from "../lib/announcement";
import { examSummary, RESOURCE_TYPES } from "../utils/format";

describe("categories", () => {
  it("has exactly the five V1 categories", () => {
    expect(RESOURCE_TYPES.map((t) => t.value)).toEqual(["pyq", "notes", "study_material", "lab", "other"]);
  });
  it("exam details (year/session) are question-paper only", () => {
    const base = { academic_year: 2023, exam_session: "December", exam_type: "end_semester" as const };
    expect(examSummary({ ...base, resource_type: "pyq" })).toContain("2023");
    expect(examSummary({ ...base, resource_type: "notes" })).toBeNull();
  });
});

describe("year filter", () => {
  const noop = () => {};
  it("is hidden for every non-pyq selection", async () => {
    for (const type of [undefined, "notes", "study_material", "lab", "other"] as const) {
      const { unmount } = render(<ResourceFilters filters={{ type }} onChange={noop} showType />);
      expect(screen.queryByLabelText("Year")).toBeNull();
      unmount();
    }
  });
  it("appears for question papers, lists real years, never says 'No years yet'", async () => {
    render(<ResourceFilters filters={{ type: "pyq" }} onChange={noop} showType />);
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Year")); // the designed dropdown opens a listbox
    await waitFor(() => expect(within(screen.getByRole("listbox")).getByRole("option", { name: "2024" })).toBeInTheDocument());
    expect(screen.queryByText(/no years yet/i)).toBeNull();
  });
  it("choosing another category clears the year", async () => {
    const onChange = vi.fn();
    render(<ResourceFilters filters={{ type: "pyq", year: 2023 }} onChange={onChange} showType />);
    await userEvent.click(screen.getByLabelText("Category"));
    await userEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Notes" }));
    expect(onChange).toHaveBeenCalledWith({ type: "notes", year: undefined });
  });
});

describe("welcome screen", () => {
  beforeEach(() => vi.useRealTimers());
  it("does not dismiss itself, only on click, and does not return in the same session", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { unmount } = render(<WelcomeOverlay />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // still there after a minute
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Enter" }));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    render(<WelcomeOverlay />); // e.g. navigation remount / refresh in the same tab
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText(/replay/i)).toBeNull();
    vi.useRealTimers();
  });
});

describe("offline screen", () => {
  it("shows the clean offline message and Try Again really re-checks the connection", async () => {
    check.mockClear();
    render(<OfflineScreen />);
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByText(/check your connection and try again/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(check).toHaveBeenCalledTimes(1);
  });
});

describe("subject empty state", () => {
  const renderSubject = () => render(<MemoryRouter initialEntries={["/subject/s1"]}><Routes><Route path="/subject/:id" element={<SubjectPage />} /></Routes></MemoryRouter>);
  const get = api.getSubjectResources as unknown as ReturnType<typeof vi.fn>;

  it("shows the clean empty message only when the subject genuinely has zero resources", async () => {
    get.mockResolvedValue([]);
    renderSubject();
    expect(await screen.findByText("No resources available yet.")).toBeInTheDocument();
  });
  it("does not show it while loading", async () => {
    get.mockReturnValue(new Promise(() => {}));
    renderSubject();
    await screen.findByText("Database Management Systems");
    expect(screen.queryByText("No resources available yet.")).toBeNull();
  });
  it("does not show it on a load error", async () => {
    get.mockRejectedValue(new Error("boom"));
    renderSubject();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("No resources available yet.")).toBeNull();
  });
  it("shows no year control for notes; year control + year-empty message (not the dialogue) for papers", async () => {
    const r = (o: object) => ({ id: Math.random().toString(), title: "T", file_size_bytes: 1, created_at: new Date().toISOString(), exam_session: null, exam_type: null, subject_code: "PCCST402", ...o });
    get.mockResolvedValue([r({ resource_type: "notes", academic_year: null }), r({ resource_type: "pyq", academic_year: 2023 })]);
    renderSubject();
    await screen.findByText("Database Management Systems");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: /notes/i }).catch(() => screen.getByText(/^Notes/)));
    expect(screen.queryByLabelText("Year")).toBeNull();
    await user.click(screen.getByText(/Question papers/));
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(screen.queryByText("No resources available yet.")).toBeNull();
  });
});

describe("question papers across subjects (regression)", () => {
  const get = api.getSubjectResources as unknown as ReturnType<typeof vi.fn>;
  const paper = (title: string, year: number) => ({ id: title, title, resource_type: "pyq", academic_year: year, file_size_bytes: 1, created_at: new Date().toISOString(), exam_session: null, exam_type: null, subject_code: "X" });
  function Go() { const nav = useNavigate(); return <button onClick={() => nav("/subject/s2")}>next-subject</button>; }

  it("a year picked on one subject never hides the next subject's papers", async () => {
    get.mockImplementation(async (id: string) => (id === "s1" ? [paper("A-2023", 2023), paper("A-2024", 2024)] : [paper("B-2022", 2022)]));
    render(<MemoryRouter initialEntries={["/subject/s1"]}><Go /><Routes><Route path="/subject/:id" element={<SubjectPage />} /></Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: /question papers/i }));
    await user.click(screen.getByLabelText("Year"));
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "2023" }));
    expect(await screen.findByText("A-2023")).toBeInTheDocument();
    expect(screen.queryByText("A-2024")).toBeNull();
    await user.click(screen.getByText("next-subject"));
    expect(await screen.findByText("B-2022")).toBeInTheDocument(); // used to read "No question papers for 2023"
  });

  it("keeps the Question papers category visible, with a plain empty state, when a subject has none", async () => {
    get.mockResolvedValue([{ ...paper("Notes-1", 0), resource_type: "notes", academic_year: null }]);
    render(<MemoryRouter initialEntries={["/subject/s1"]}><Routes><Route path="/subject/:id" element={<SubjectPage />} /></Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: /question papers/i }));
    expect(await screen.findByText(/No question papers for PCCST402 yet/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Year")).toBeNull();
  });
});

describe("Malayalam copy", () => {
  it("is real Malayalam script, tagged lang=ml", async () => {
    expect(RANGA_EMPTY_DIALOGUE).toMatch(/[\u0D00-\u0D7F]/);
    const { container } = render(<EmptyState title={RANGA_EMPTY_DIALOGUE} />);
    const line = container.querySelector("[lang='ml']");
    expect(line).not.toBeNull();
  });
});

describe("ranga wordmark popup", () => {
  it("opens on clicking ranga, displays the required text, and closes on Escape or outside click", async () => {
    render(
      <div>
        <InteractiveWordmark />
        <button type="button">outside-element</button>
      </div>
    );
    expect(screen.queryByText("Why name Ranga?")).toBeNull();

    const trigger = screen.getByRole("button", { name: /Why name Ranga\?|ranga/i });
    await userEvent.click(trigger);

    expect(screen.getByText("Why name Ranga?")).toBeInTheDocument();
    expect(screen.getByText(/Ithokke oru fun alle bro/i)).toBeInTheDocument();

    // Closes on Escape
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Why name Ranga?")).toBeNull();

    // Re-open and close on outside click
    await userEvent.click(trigger);
    expect(screen.getByText("Why name Ranga?")).toBeInTheDocument();

    await userEvent.click(screen.getByText("outside-element"));
    expect(screen.queryByText("Why name Ranga?")).toBeNull();
  });
});

