export default function StepInterests({ data, onChange, headingRef }) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-medium mb-2 focus:outline-none"
      >
        What draws you in?
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        A sentence or two is enough -- this is compared against what each university is known for.
      </p>

      <label htmlFor="interest_text" className="sr-only">
        Your interests
      </label>
      <textarea
        id="interest_text"
        rows={4}
        value={data.interest_text}
        onChange={(e) => onChange({ interest_text: e.target.value })}
        className="w-full border rounded-lg p-3"
        placeholder="e.g. I love building things, robotics, and figuring out how systems work"
      />
    </div>
  );
}
