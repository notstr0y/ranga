import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Programme = {
  id: string;
  code: string;
  name: string;
};

type Scheme = {
  id: string;
  code: string;
  name: string;
};

type Semester = {
  id: string;
  semester_number: number;
  name: string;
};

type Subject = {
  id: string;
  code: string;
  name: string;
  course_type: string | null;
  course_category: string | null;
  credits: number | null;
};

function App() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [programmeId, setProgrammeId] = useState("");
  const [schemeId, setSchemeId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");

  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProgrammes() {
      const { data, error } = await supabase
        .from("programmes")
        .select("id, code, name")
        .order("name");

      if (error) setError(error.message);
      else setProgrammes(data ?? []);

      setLoading(false);
    }

    loadProgrammes();
  }, []);

  useEffect(() => {
    async function loadSchemes() {
      setSchemes([]);
      setSemesters([]);
      setSubjects([]);
      setSchemeId("");
      setSelectedSemesterId("");

      if (!programmeId) return;

      const { data, error } = await supabase
        .from("schemes")
        .select("id, code, name")
        .eq("programme_id", programmeId)
        .order("code");

      if (error) setError(error.message);
      else setSchemes(data ?? []);
    }

    loadSchemes();
  }, [programmeId]);

  useEffect(() => {
    async function loadSemesters() {
      setSemesters([]);
      setSubjects([]);
      setSelectedSemesterId("");

      if (!schemeId) return;

      const { data, error } = await supabase
        .from("semesters")
        .select("id, semester_number, name")
        .eq("scheme_id", schemeId)
        .order("semester_number");

      if (error) setError(error.message);
      else setSemesters(data ?? []);
    }

    loadSemesters();
  }, [schemeId]);

  useEffect(() => {
    async function loadSubjects() {
      setSubjects([]);
      setError("");

      if (!selectedSemesterId) return;

      setSubjectsLoading(true);

      const { data, error } = await supabase
        .from("subjects")
        .select(
          "id, code, name, course_type, course_category, credits"
        )
        .eq("semester_id", selectedSemesterId)
        .order("code");

      if (error) setError(error.message);
      else setSubjects(data ?? []);

      setSubjectsLoading(false);
    }

    loadSubjects();
  }, [selectedSemesterId]);

  const selectedSemester = semesters.find(
    (semester) => semester.id === selectedSemesterId
  );

  return (
    <main className="min-h-screen bg-[#111] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl font-bold tracking-[0.2em]">
            RANGA<span className="text-gray-500">.</span>
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            KTU resources. All in one place.
          </p>
        </header>

        {/* Academic library */}
        <section>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gray-500">
            Academic library
          </p>

          <h2 className="mb-8 text-3xl font-semibold">
            Find your resources.
          </h2>

          {loading ? (
            <p className="text-gray-400">Loading programmes...</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">

              {/* Programme */}
              <label className="text-sm text-gray-400">
                Programme
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1c1c1c] p-4 text-white"
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                >
                  <option value="">Choose programme</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Scheme */}
              <label className="text-sm text-gray-400">
                Scheme
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#1c1c1c] p-4 text-white"
                  value={schemeId}
                  onChange={(e) => setSchemeId(e.target.value)}
                  disabled={!programmeId}
                >
                  <option value="">Choose scheme</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

            </div>
          )}

          {/* Semesters */}
          {semesters.length > 0 && (
            <div className="mt-12">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-medium">Semesters</h3>
                <span className="text-xs text-gray-500">
                  {semesters.length} semesters
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {semesters.map((semester) => (
                  <button
                    key={semester.id}
                    onClick={() =>
                      setSelectedSemesterId(semester.id)
                    }
                    className={`rounded-xl border p-5 text-left transition ${
                      selectedSemesterId === semester.id
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-[#1c1c1c] hover:border-white/40"
                    }`}
                  >
                    <span className="text-xs opacity-60">
                      SEMESTER
                    </span>
                    <p className="mt-2 text-2xl font-semibold">
                      {String(semester.semester_number).padStart(2, "0")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subjects */}
          {selectedSemester && (
            <section className="mt-14">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">
                    Academic catalogue
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {selectedSemester.name}
                  </h3>
                </div>

                {!subjectsLoading && (
                  <span className="text-sm text-gray-500">
                    {subjects.length} subjects
                  </span>
                )}
              </div>

              {subjectsLoading ? (
                <p className="text-gray-400">Loading subjects...</p>
              ) : subjects.length === 0 && !error ? (
                <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-8 text-center">
                  <p className="text-gray-300">
                    No subjects added yet.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    This semester's catalogue is not available yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex flex-col gap-3 border-b border-white/10 bg-[#1c1c1c] p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-xs font-medium tracking-wider text-gray-500">
                          {subject.code}
                        </p>
                        <h4 className="mt-1 font-medium">
                          {subject.name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {subject.course_category && (
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                            {subject.course_category}
                          </span>
                        )}

                        {subject.course_type && (
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                            {subject.course_type}
                          </span>
                        )}

                        {subject.credits !== null && (
                          <span className="text-xs text-gray-500">
                            {subject.credits} credits
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {error && (
            <p className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </p>
          )}
        </section>

        <footer className="mt-24 border-t border-white/10 pt-6 text-xs text-gray-600">
          RANGA — Built for KTU students.
        </footer>
      </div>
    </main>
  );
}

export default App;
