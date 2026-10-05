import { useEffect, useState } from "react";
import { getMatches, getScholarships } from "../api.js";
import MatchCard from "./MatchCard.jsx";

// profile can be null -- that happens when the student came from the
// landing page's "Just browse scholarships" button, skipping the wizard
// entirely since scholarships aren't matched against a student profile.
export default function Dashboard({ profile, initialTab = "universities", onRestart, onStartWizard }) {
  const [tab, setTab] = useState(initialTab);
  const [matches, setMatches] = useState(null);
  const [scholarships, setScholarships] = useState(null);
  const [scholarshipsError, setScholarshipsError] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(profile !== null);

  useEffect(() => {
    if (profile === null) {
      // Nothing to fetch -- the Universities tab will show a prompt to
      // take the wizard instead of a loading spinner that never resolves.
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMatches(profile)
      .then((result) => {
        if (!cancelled) setMatches(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (tab === "scholarships" && scholarships === null && scholarshipsError === null) {
      getScholarships()
        .then((result) => setScholarships(result.scholarships))
        .catch((err) => setScholarshipsError(err.message));
      // Previously this caught errors by silently setting an empty array,
      // which made "the API call failed" look identical to "there's
      // genuinely no scholarship data yet" -- impossible to tell apart
      // from the UI, which is exactly the bug that prompted this fix.
    }
  }, [tab, scholarships, scholarshipsError]);

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Result category">
        <TabButton active={tab === "universities"} onClick={() => setTab("universities")}>
          Universities
        </TabButton>
        <TabButton active={tab === "scholarships"} onClick={() => setTab("scholarships")}>
          Scholarships
        </TabButton>
      </div>

      {/* Announces load state changes to screen readers without moving
          visible focus -- polite means it waits for a pause rather than
          interrupting whatever the user is doing. */}
      <p aria-live="polite" className="sr-only">
        {loading && "Loading matches"}
        {matches && `${matches.length} universities found`}
        {error && `Error: ${error}`}
      </p>

      {tab === "universities" && (
        <UniversitiesTab
          profile={profile}
          loading={loading}
          error={error}
          matches={matches}
          onRestart={onRestart}
          onStartWizard={onStartWizard}
        />
      )}

      {tab === "scholarships" && <ScholarshipsTab scholarships={scholarships} error={scholarshipsError} />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`text-sm font-medium px-3 py-1.5 rounded-full ${
        active ? "bg-green-600 text-white" : "text-gray-600 border"
      }`}
    >
      {children}
    </button>
  );
}

function UniversitiesTab({ profile, loading, error, matches, onRestart, onStartWizard }) {
  // Arrived here via "Just browse scholarships" on the landing page --
  // there's no profile to match against, so prompt rather than spin forever.
  if (profile === null) {
    return (
      <div className="text-sm bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="mb-3">Take the quick quiz to see universities matched to you.</p>
        <button type="button" onClick={onStartWizard} className="text-sm font-medium text-green-700 underline">
          Start the quiz
        </button>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-gray-500">Finding your matches...</p>;

  if (error) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
        Something went wrong loading matches: {error}
      </div>
    );
  }

  if (matches && matches.length === 0) {
    // Known gap (see project README): a score below every cutoff returns
    // an empty list from the backend. Handled here in the UI for now
    // rather than in the backend, so the student isn't left at a dead end.
    return (
      <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="mb-3">
          No university in our current list matches that score yet. You can still explore what's out there without
          a fixed score.
        </p>
        <button type="button" onClick={onRestart} className="text-sm font-medium text-green-700 underline">
          Restart and explore instead
        </button>
      </div>
    );
  }

  return <div>{matches?.map((m) => <MatchCard key={m.university_name} match={m} />)}</div>;
}

function ScholarshipsTab({ scholarships, error }) {
  if (error) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
        Couldn't reach the scholarships API: {error}
        <br />
        <span className="text-xs text-red-500">
          Check VITE_API_BASE_URL and that the backend's CORS_ORIGINS includes this site.
        </span>
      </div>
    );
  }
  if (scholarships === null) return <p className="text-sm text-gray-500">Loading scholarships...</p>;
  if (scholarships.length === 0) return <p className="text-sm text-gray-500">No scholarships loaded yet.</p>;

  return (
    <ul className="space-y-3">
      {scholarships.map((s) => (
        <li key={s.id} className="border rounded-xl p-3 bg-white">
          <a href={s.link} target="_blank" rel="noreferrer" className="font-medium text-sm text-green-700 underline">
            {s.title}
          </a>
          {s.published_date && <p className="text-xs text-gray-500 mt-1">{s.published_date}</p>}
        </li>
      ))}
    </ul>
  );
}
