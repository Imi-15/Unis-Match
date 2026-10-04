// NOTE: max_tuition and preferred_region are sent to the backend and
// stored on the student profile, but matching.py does not use them in
// scoring yet (see the "Known gaps" section of the project README).
// They're collected here so the data model is ready once that's added.
export default function StepBudget({ data, onChange, headingRef }) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-medium mb-4 focus:outline-none"
      >
        A couple of practical details
      </h2>

      <div className="mb-4">
        <label htmlFor="max_tuition" className="block text-sm font-medium mb-1">
          Max tuition per year (optional)
        </label>
        <input
          id="max_tuition"
          type="number"
          min={0}
          inputMode="numeric"
          value={data.max_tuition ?? ""}
          onChange={(e) => onChange({ max_tuition: e.target.value ? Number(e.target.value) : null })}
          className="w-full border rounded-lg p-2"
          placeholder="e.g. 400000"
        />
      </div>

      <div>
        <label htmlFor="preferred_region" className="block text-sm font-medium mb-1">
          Preferred region (optional)
        </label>
        <input
          id="preferred_region"
          type="text"
          value={data.preferred_region ?? ""}
          onChange={(e) => onChange({ preferred_region: e.target.value })}
          className="w-full border rounded-lg p-2"
          placeholder="e.g. South West, or leave blank for no preference"
        />
      </div>
    </div>
  );
}
