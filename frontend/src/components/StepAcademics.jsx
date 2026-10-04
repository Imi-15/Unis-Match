export default function StepAcademics({ data, onChange, headingRef }) {
  // Three modes map directly onto what the backend's matching engine
  // understands (see backend/app/matching.py's docstring):
  //   "decided"      -> utme_score is set
  //   "hypothetical" -> only target_score is set
  //   "exploring"    -> neither is set
  const status = data.academicStatus;

  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-medium mb-4 focus:outline-none"
      >
        Where are you in the JAMB process?
      </h2>

      <fieldset className="space-y-3">
        <legend className="sr-only">Academic status</legend>

        <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
          <input
            type="radio"
            name="academicStatus"
            value="decided"
            checked={status === "decided"}
            onChange={() => onChange({ academicStatus: "decided" })}
            className="mt-1"
          />
          <span>
            <span className="block font-medium text-sm">I have my JAMB score</span>
            <span className="block text-sm text-gray-500">See universities you can get into right now</span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
          <input
            type="radio"
            name="academicStatus"
            value="hypothetical"
            checked={status === "hypothetical"}
            onChange={() => onChange({ academicStatus: "hypothetical" })}
            className="mt-1"
          />
          <span>
            <span className="block font-medium text-sm">I'm targeting a score</span>
            <span className="block text-sm text-gray-500">See what a score you're aiming for would open up</span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
          <input
            type="radio"
            name="academicStatus"
            value="exploring"
            checked={status === "exploring"}
            onChange={() => onChange({ academicStatus: "exploring" })}
            className="mt-1"
          />
          <span>
            <span className="block font-medium text-sm">I haven't written JAMB yet</span>
            <span className="block text-sm text-gray-500">Just exploring options for now</span>
          </span>
        </label>
      </fieldset>

      {status === "decided" && (
        <div className="mt-4">
          <label htmlFor="utme_score" className="block text-sm font-medium mb-1">
            Your UTME score
          </label>
          <input
            id="utme_score"
            type="number"
            min={0}
            max={400}
            inputMode="numeric"
            value={data.utme_score ?? ""}
            onChange={(e) => onChange({ utme_score: e.target.value ? Number(e.target.value) : null })}
            className="w-full border rounded-lg p-2"
            placeholder="e.g. 248"
          />
        </div>
      )}

      {status === "hypothetical" && (
        <div className="mt-4">
          <label htmlFor="target_score" className="block text-sm font-medium mb-1">
            Score you're aiming for
          </label>
          <input
            id="target_score"
            type="number"
            min={0}
            max={400}
            inputMode="numeric"
            value={data.target_score ?? ""}
            onChange={(e) => onChange({ target_score: e.target.value ? Number(e.target.value) : null })}
            className="w-full border rounded-lg p-2"
            placeholder="e.g. 220"
          />
        </div>
      )}
    </div>
  );
}
