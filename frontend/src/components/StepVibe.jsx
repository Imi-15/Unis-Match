// Each option bundles several of the culture_tags found in
// backend/data/universities.json into one plain-language choice. The
// backend compares these tag sets directly (see jaccard_similarity in
// matching.py), so the tags here must match the tags used in that file.
export const VIBE_OPTIONS = [
  {
    id: "structured",
    label: "Structured and secure",
    description: "Quiet, faith-based or private campuses",
    tags: ["strict", "structured", "faith_based"],
  },
  {
    id: "vibrant",
    label: "Vibrant and diverse",
    description: "Large public campuses, rich culture, room to explore",
    tags: ["diverse", "community", "vibrant", "exploratory"],
  },
  {
    id: "tech",
    label: "Tech and research focused",
    description: "Specialized, hands-on, practical communities",
    tags: ["tech_focused", "research_focused"],
  },
  {
    id: "flexible",
    label: "Just want a solid degree",
    description: "Size or prestige doesn't matter -- any accredited school works",
    tags: [],
    flexible: true,
  },
];

export default function StepVibe({ data, onChange, headingRef }) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-medium mb-4 focus:outline-none"
      >
        What kind of campus fits you?
      </h2>

      <fieldset className="space-y-3">
        <legend className="sr-only">Campus vibe</legend>
        {VIBE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50"
          >
            <input
              type="radio"
              name="vibe"
              value={option.id}
              checked={data.vibeOptionId === option.id}
              onChange={() =>
                onChange({ vibeOptionId: option.id, vibe_tags: option.tags, flexible: Boolean(option.flexible) })
              }
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-sm">{option.label}</span>
              <span className="block text-sm text-gray-500">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
