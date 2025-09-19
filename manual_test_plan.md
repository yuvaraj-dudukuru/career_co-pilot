# Manual Test Plan – Career Co-Pilot (Hackathon Readiness)

Purpose: Validate end-to-end behavior with realistic personas using Firebase emulators or a staging project. Ensure deterministic scoring transparency, plan validation/fallbacks, auth, sharing, and print UX.

Pre-requisites
- Firebase project or emulators running (`firebase emulators:start`)
- Functions configured with GEMINI key (or accept deterministic fallback)
- Frontend served (Firebase Hosting emulator or static server)
- Fill Firebase web config in `public/app.js` locally (do not commit)

Global Acceptance Criteria
1) Auth: Google sign-in succeeds; protected endpoints reject unauthenticated requests.
2) /api/recommend: returns exactly 3 items with fields: `title`, `fitScore`, `metrics{cosine, overlapRatio}`, `overlapSkills`, `gapSkills`, `why`, and `plan.weeks.length === 4`.
3) Firestore writes: `/users/{uid}/recommendations/{id}` created and analytics event stored.
4) Dashboard: shows fitScore bar, overlap/gap chips, why text, methodology modal; “View Learning Plan” opens modal; “Download PDF” triggers print UI with A4 styles.
5) Share link: “Share Plan” copies a tokenized URL; opening it renders read-only plan; expired/invalid token shows error.
6) No secrets in source; keys provided via env/config; fairness notice visible.

---

Persona 1 – Priya (Frontend-focused student)
- Profile
  - Name: Priya S
  - Education: Bachelor's Degree
  - Skills: "HTML, CSS, JavaScript, Git"
  - Interests: "web development"
  - Weekly Time: 6
  - Budget: free
  - Language: en

Steps & Expected Results
1) Sign in with Google → Header shows user + Sign Out.
2) Submit profile → Loading then navigate to dashboard.
3) Dashboard shows 3 roles. Expect "Frontend Developer" near top.
4) Each card shows:
   - fitScore 0–100 with progress bar
   - metrics visible (cosine, overlap)
   - green overlap chips include HTML/CSS/JavaScript
   - red gap chips include TypeScript/Responsive Design/State Mgmt (varies)
   - concise “why” text (≤120 words)
5) View plan → 4 weeks visible, each with topics, practice, assessment, project.
6) Print → Browser print dialog; content fits A4; header/controls hidden.
7) Share → Link copied; paste in private window → read-only view loads.

Data checks
- Firestore has `/users/{uid}/recommendations/{id}` with `top3Recommendations[0].fitScore`, `overlapSkills`, `gapSkills`, `plan.weeks.length===4`.
- `/analytics` contains `profile_submitted` and `recommendation_generated`.

---

Persona 2 – Arjun (Data/Analytics aspirant)
- Profile
  - Name: Arjun M
  - Education: Master's Degree
  - Skills: "Excel, SQL, Python"
  - Interests: "data science"
  - Weekly Time: 8
  - Budget: low
  - Language: en

Steps & Expected Results
1) Submit profile → Top roles likely include "Data Analyst" and/or "Data Scientist".
2) Metrics: cosine/overlap non-zero; fitScore computed via formula and shown.
3) Overlap chips contain Excel/SQL/Python; gaps include Statistics, Visualization tools.
4) Plan has 4 weeks; content appropriate for 8 hrs/week; if LLM unavailable, deterministic fallback appears but still 4 weeks.
5) Share link functions; read-only hides edit/delete/sign out controls.

Data checks
- Firestore doc saved; analytics event logged with rolesCount=3.

---

Persona 3 – Meera (Career switch to Product Management)
- Profile
  - Name: Meera K
  - Education: Diploma
  - Skills: "Communication, Analysis, Excel"
  - Interests: "product management"
  - Weekly Time: 4
  - Budget: any
  - Language: en

Steps & Expected Results
1) Submit profile → Recommend "Product Manager" among top 3.
2) Overlap chips: Communication, Analysis; gaps include Strategy, Research, Agile.
3) Explanation avoids sensitive attributes; fairness message visible.
4) Plan has realistic light workload for 4 hrs/week.
5) Print and share behave as in other personas.

---

Error & Robustness Scenarios
- Invalid profile (empty skills): API returns 400; UI shows error toast.
- LLM timeout or bad JSON: server retries once; if still invalid, returns deterministic fallback plan; UI still displays 4-week plan.
- Unauthorized call: `/api/recommend` without token → 401.
- Share token expired (simulate by editing Firestore `expiresAt` to past) → open link returns error message.

Performance & UX Checks
- Recommendation generation returns within ~3–10s with Gemini; within ~1–2s with fallback.
- Dashboard renders without layout shift; chips wrap cleanly; print uses 1–2 pages.

Security & Compliance
- Ensure no secrets in repo; `.env`/functions config used for keys.
- Firestore rules: reads/writes restricted to owners; analytics write-only; share tokens stored server-side.

Sign-off
- All personas pass acceptance criteria and robustness checks.

