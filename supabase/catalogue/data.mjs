// RANGA V1 catalogue data — CSE only.
//
//  * CSE 2019 scheme: S1–S2 seeded (first-year courses). S3–S8 are NOT seeded yet — see README "Catalogue status".
//  * CSE 2024 scheme: S1–S5 seeded from the KTU B.Tech Curriculum-2024 (Computer Science and Engineering,
//    Branch Code CS, Group A) PDF supplied by the project owner. S6–S8 exist as empty semesters.
//
// Rules for adding rows:
//  * Never invent a code or shorten an official title. Copy both from a curriculum document.
//  * verification: 'verified_official'  -> read from a KTU-issued document that was checked at its KTU origin
//                  'verified_secondary' -> KTU curriculum document as obtained from a mirror / college archive
//                  'needs_review'       -> unclear print, ambiguous pairing, conflicting sources
//  * Re-run:  npm run catalogue:build

export const SOURCES = {
  KTU2019_S1S2:
    "https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf",
  KTU2019_CSE_S1S8:
    "https://cse.cet.ac.in/wp-content/uploads/2024/08/COMPUTERSCIENCEANDENGINEERINGS1-S8-.pdf",
  KTU2024_CSE:
    "KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)",
};

// code, name, degree, sort order
export const PROGRAMMES = [["CSE", "Computer Science and Engineering", "B.Tech", 10]];

export const SCHEMES = [
  { programme: "CSE", code: "2019", name: "2019 Scheme", status: "verified_secondary", source: SOURCES.KTU2019_CSE_S1S8 },
  { programme: "CSE", code: "2024", name: "2024 Scheme", status: "verified_secondary", source: SOURCES.KTU2024_CSE },
];

const S = "verified_secondary";
const R = "needs_review";
const S19 = SOURCES.KTU2019_S1S2;
const S24 = SOURCES.KTU2024_CSE;

// [code, name, course_type, course_category, credits, ltp, notes, status, source]
export const COURSES = [
  // ---------- CSE 2019 — first year ----------
  ["MAT101", "Linear Algebra and Calculus", "theory", "BSC", 4, "3-1-0", null, S, S19],
  ["MAT102", "Vector Calculus, Differential Equations and Transforms", "theory", "BSC", 4, "3-1-0", null, S, S19],
  ["PHT100", "Engineering Physics A", "theory", "BSC", 4, "3-1-0", null, S, S19],
  ["PHT110", "Engineering Physics B", "theory", "BSC", 4, "3-1-0", null, S, S19],
  ["CYT100", "Engineering Chemistry", "theory", "BSC", 4, "3-1-0", null, S, S19],
  ["EST100", "Engineering Mechanics", "theory", "ESC", 3, "2-1-0", null, S, S19],
  ["EST110", "Engineering Graphics", "theory", "ESC", 3, "2-0-2", null, S, S19],
  ["EST120", "Basics of Civil and Mechanical Engineering", "theory", "ESC", 4, "4-0-0", "Printed as “Basics of Civil & Mechanical Engineering” in the S1–S8 syllabus", S, S19],
  ["EST130", "Basics of Electrical and Electronics Engineering", "theory", "ESC", 4, "4-0-0", null, S, S19],
  ["EST102", "Programming in C", "theory", "ESC", 4, "2-1-2", null, S, S19],
  ["HUN101", "Life Skills", "theory", "MNC", null, "2-0-2", "Mandatory non-credit course", S, S19],
  ["HUN102", "Professional Communication", "theory", "MNC", null, "2-0-2", "Mandatory non-credit course", S, S19],
  ["PHL120", "Engineering Physics Lab", "lab", "BSC", 1, "0-0-2", null, S, S19],
  ["CYL120", "Engineering Chemistry Lab", "lab", "BSC", 1, "0-0-2", null, S, S19],
  ["ESL120", "Civil and Mechanical Workshop", "workshop", "ESC", 1, "0-0-2", null, S, S19],
  ["ESL130", "Electrical and Electronics Workshop", "workshop", "ESC", 1, "0-0-2", null, S, S19],

  // ---------- CSE 2024 — S1 / S2 (Group A) ----------
  ["GAMAT101", "Mathematics for Information Science-1", "theory", "BSC", 3, "3-0-0-0", null, S, S24],
  ["GAPHT121", "Physics for Information Science", "theory", "BSC", 4, "3-0-2-0", "Offered in S1 or S2 (slot B)", S, S24],
  ["GXCYT122", "Chemistry for Information Science", "theory", "BSC", 4, "3-0-2-0", "Offered in S1 or S2 (slot B)", S, S24],
  ["GMEST103", "Engineering Graphics and Computer Aided Drawing", "theory", "ESC", 3, "2-0-2-0", "Printed with a trailing full stop in the source", S, S24],
  ["GXEST104", "Introduction to Electrical & Electronics Engineering", "theory", "ESC", 4, "2-0-0-0", "Two parts: Electrical Engineering (2) + Electronics Engineering (2)", S, S24],
  ["UCEST105", "Algorithmic Thinking with Python", "theory", "ESC", 4, "3-0-2-0", null, S, S24],
  ["GXESL106", "Basic Electrical and Electronics Engineering Workshop", "workshop", "ESC", 1, "0-0-2-0", null, S, S24],
  ["UCHWT127", "Health and Wellness", "other", "HWP", 1, "1-0-1-0", "No grade points are awarded; offered in S1 or S2 (slot I)", S, S24],
  ["UCHUT128", "Life Skills and Professional Communication", "theory", "HMC", 1, "2-0-1-0", "Offered in S1 or S2 (slot I); valued at college level", S, S24],
  ["UCSEM129", "Skill Enhancement Course: Digital 101 (NASSCOM)", "other", "SEC", 1, null, "MOOC; may be completed in S1 or S2; credit is recorded in the S2 grade card", S, S24],
  ["GAMAT201", "Mathematics for Information Science-2", "theory", "BSC", 3, "3-0-0-0", null, S, S24],
  ["GXEST203", "Foundations of Computing: From Hardware Essentials to Web Design", "theory", "ESC", 3, "3-0-0-0", null, S, S24],
  ["GXEST204", "Programming in C", "theory", "ESC", 4, "3-0-2-0", null, S, S24],
  ["PCCST205", "Discrete Mathematics", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["UCEST206", "Engineering Entrepreneurship & IPR", "theory", "ESC", 3, "3-0-0-0", null, S, S24],
  ["GXESL208", "IT Workshop", "workshop", "ESC", 1, "0-0-2-0", null, S, S24],

  // ---------- CSE 2024 — S3 ----------
  ["GAMAT301", "Mathematics for Information Science-3", "theory", "BSC", 3, "3-0-0-0", null, S, S24],
  ["PCCST302", "Theory of Computation", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PCCST303", "Data Structures and Algorithms", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PBCST304", "Object Oriented Programming", "theory", "PCPBL", 4, "3-0-0-1", "Project based learning (PBL) course", S, S24],
  ["GAEST305", "Digital Electronics & Logic Design", "theory", "ESC", 4, "3-1-0-0", "L-T-P-R printed with one column missing in the source; 3-1-0-0 inferred from the 4 hours/week", S, S24],
  ["UCHUT346", "Economics for Engineers", "theory", "HMC", 2, "2-0-0-0", "Offered in S3 or S4 (slot G). Code-to-title pairing read from stacked rows — confirm against the original KTU PDF", R, S24],
  ["UCHUT347", "Engineering Ethics and Sustainable Development", "theory", "HMC", 2, "2-0-0-0", "Offered in S3 or S4 (slot G). Code-to-title pairing read from stacked rows — confirm against the original KTU PDF", R, S24],
  ["PCCSL307", "Data Structures Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],
  ["PCCSL308", "Digital Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],

  // ---------- CSE 2024 — S4 ----------
  ["GAMAT401", "Mathematics for Information Science-4", "theory", "BSC", 3, "3-0-0-0", null, S, S24],
  ["PCCST402", "Database Management Systems", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PCCST403", "Operating Systems", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PBCST404", "Computer Organization and Architecture", "theory", "PCPBL", 4, "3-0-0-1", "Project based learning (PBL) course", S, S24],
  ["PECST411", "Software Engineering", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST412", "Pattern Recognition", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST413", "Functional Programming", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST414", "Coding Theory", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST415", "VLSI Design", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met", S, S24],
  ["PECST416", "Signals And Systems", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST417", "Soft Computing", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST418", "Computational Geometry", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST419", "Cyber Ethics, Privacy, And Legal Issues", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1", S, S24],
  ["PECST495", "Advanced Data Structures", "elective", "PE", 3, "3-0-0-0", "Programme Elective 1. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met", S, S24],
  ["PCCSL407", "Operating Systems Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],
  ["PCCSL408", "DBMS Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],

  // ---------- CSE 2024 — S5 ----------
  ["PCCST501", "Computer Networks", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PCCST502", "Design and Analysis of Algorithms", "theory", "PC", 4, "3-1-0-0", null, S, S24],
  ["PCCST503", "Machine Learning", "theory", "PC", 3, "3-0-0-0", null, S, S24],
  ["PBCST504", "Microcontrollers", "theory", "PCPBL", 4, "3-0-0-1", "Project based learning (PBL) course", S, S24],
  ["PECST521", "Software Project Management", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST522", "Artificial Intelligence", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST523", "Data Analytics", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST524", "Data Compression", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST525", "Data Mining", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met", S, S24],
  ["PECST526", "Digital Signal Processing", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST527", "Computer Graphics & Multimedia", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST528", "Advanced Computer Architectures", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2", S, S24],
  ["PECST595", "Advanced Graph Algorithms", "elective", "PE", 3, "3-0-0-0", "Programme Elective 2. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met", S, S24],
  ["UCHUM506", "Constitution Of India (MOOC)", "other", "HMC", 1, null, "MOOC; no grade points are awarded (slot I)", S, S24],
  ["PCCSL507", "Networks Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],
  ["PCCSL508", "Machine Learning Lab", "lab", "PCL", 2, "0-0-3-0", null, S, S24],
];

// [course code, slot] per semester
export const SEMESTERS_2019 = {
  1: [
    ["MAT101", "A"], ["PHT100", "B 1/2"], ["PHT110", "B 1/2"], ["CYT100", "B 1/2"],
    ["EST100", "C 1/2"], ["EST110", "C 1/2"], ["EST120", "D 1/2"], ["EST130", "D 1/2"],
    ["HUN101", "E"], ["PHL120", "S 1/2"], ["CYL120", "S 1/2"], ["ESL120", "T 1/2"], ["ESL130", "T 1/2"],
  ],
  2: [
    ["MAT102", "A"], ["PHT100", "B 1/2"], ["PHT110", "B 1/2"], ["CYT100", "B 1/2"],
    ["EST100", "C 1/2"], ["EST110", "C 1/2"], ["EST120", "D 1/2"], ["EST130", "D 1/2"],
    ["HUN102", "E"], ["EST102", "F"], ["PHL120", "S 1/2"], ["CYL120", "S 1/2"],
    ["ESL120", "T 1/2"], ["ESL130", "T 1/2"],
  ],
};

const UC1 = [["UCHWT127", "I"], ["UCHUT128", "I"], ["UCSEM129", null]];
const PE1 = ["PECST411", "PECST412", "PECST413", "PECST414", "PECST416", "PECST417", "PECST418", "PECST419", "PECST415", "PECST495"].map((c) => [c, "E"]);
const PE2 = ["PECST521", "PECST522", "PECST523", "PECST524", "PECST526", "PECST527", "PECST528", "PECST525", "PECST595"].map((c) => [c, "E"]);

export const SEMESTERS_2024 = {
  1: [["GAMAT101", "A"], ["GAPHT121", "B"], ["GXCYT122", "B"], ["GMEST103", "C"], ["GXEST104", "D"], ["UCEST105", "F"], ["GXESL106", "L"], ...UC1],
  2: [["GAMAT201", "A"], ["GAPHT121", "B"], ["GXCYT122", "B"], ["GXEST203", "C"], ["GXEST204", "D"], ["PCCST205", "E"], ["UCEST206", "F"], ["GXESL208", "L"], ...UC1],
  3: [["GAMAT301", "A"], ["PCCST302", "B"], ["PCCST303", "C"], ["PBCST304", "D"], ["GAEST305", "F"], ["UCHUT346", "G"], ["UCHUT347", "G"], ["PCCSL307", "L"], ["PCCSL308", "Q"]],
  4: [["GAMAT401", "A"], ["PCCST402", "B"], ["PCCST403", "C"], ["PBCST404", "D"], ...PE1, ["UCHUT346", "G"], ["UCHUT347", "G"], ["PCCSL407", "L"], ["PCCSL408", "Q"]],
  5: [["PCCST501", "A"], ["PCCST502", "B"], ["PCCST503", "C"], ["PBCST504", "D"], ...PE2, ["UCHUM506", "I"], ["PCCSL507", "L"], ["PCCSL508", "Q"]],
};

// 2024 codes seeded by the PREVIOUS (pre-V1) catalogue that the supplied PDF does not support.
// 005_v1_cleanup.sql removes these from CSE 2024 (only when they have no resources attached).
export const RETIRED_2024_CODES = [
  "GACYT122", "GYEST103", "GAEST104", "GAESL106", "UCPST127", "GAEST203", "GAEST204", "GAESL208",
];
