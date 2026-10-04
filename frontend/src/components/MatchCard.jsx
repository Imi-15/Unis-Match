function badgeClasses(score) {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function MatchCard({ match }) {
  const { university_name, match_score, sub_scores, needed_score, reasons, narrative } = match;

  return (
    // <details>/<summary> is a native, built-in-accessible disclosure
    // widget -- keyboard and screen-reader support come for free, no
    // extra ARIA wiring needed. That's why it's used here instead of a
    // hand-built expand/collapse.
    <details className="border rounded-xl p-3 mb-3 bg-white">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <div>
          <p className="font-medium text-sm">{university_name}</p>
          {sub_scores.eligible === null && (
            <p className="text-xs text-gray-500 mt-0.5">Needs {needed_score}+ to qualify</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClasses(match_score)}`}>
          {match_score}%
        </span>
      </summary>

      <div className="mt-3 space-y-2">
        <ScoreBar label="Vibe match" value={sub_scores.vibe_score} />
        <ScoreBar label="Interest overlap" value={sub_scores.interest_score} />

        {/* These reasons always come from matching.py's plain-logic
            build_reasons() -- they render even with zero network access,
            which is why they're shown here unconditionally, separate
            from the optional AI narrative below. */}
        {reasons?.length > 0 && (
          <ul className="text-sm text-gray-600 space-y-1 pt-1 list-disc list-inside">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {narrative && <p className="text-sm text-gray-500 italic leading-relaxed pt-1">{narrative}</p>}
      </div>
    </details>
  );
}

function ScoreBar({ label, value }) {
  const percent = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full" role="img" aria-label={`${label}: ${percent} percent`}>
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
