import { useEffect, useRef, useState } from "react";
import StepAcademics from "./StepAcademics.jsx";
import StepInterests from "./StepInterests.jsx";
import StepVibe from "./StepVibe.jsx";
import StepBudget from "./StepBudget.jsx";

const TOTAL_STEPS = 4;

const initialData = {
  academicStatus: null, // "decided" | "hypothetical" | "exploring"
  utme_score: null,
  target_score: null,
  interest_text: "",
  vibeOptionId: null,
  vibe_tags: [],
  flexible: false,
  max_tuition: null,
  preferred_region: "",
};

export default function Wizard({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState(initialData);

  // Moves keyboard/screen-reader focus to the new step's own heading each
  // time the step changes, so a screen reader user isn't left "stuck" on
  // the previous step's content after Next/Back is pressed.
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  function updateData(patch) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function canGoNext() {
    if (stepIndex === 0) {
      if (!data.academicStatus) return false;
      if (data.academicStatus === "decided" && !data.utme_score) return false;
    }
    return true;
  }

  function goNext() {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      submit();
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function submit() {
    // Shape this exactly like backend/app/models.py's StudentProfile.
    // academicStatus and vibeOptionId are UI-only concepts and don't get
    // sent -- the backend only needs the values they resolved to.
    const profile = {
      utme_score: data.academicStatus === "decided" ? data.utme_score : null,
      target_score: data.academicStatus === "hypothetical" ? data.target_score : null,
      subject_combo: [],
      vibe_tags: data.vibe_tags,
      flexible: data.flexible,
      interest_text: data.interest_text,
      max_tuition: data.max_tuition,
      preferred_region: data.preferred_region || null,
    };
    onComplete(profile);
  }

  const steps = [StepAcademics, StepInterests, StepVibe, StepBudget];
  const StepComponent = steps[stepIndex];

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Progress indicator -- decorative bars plus a text equivalent for
          screen readers, since color/width alone conveys nothing to them. */}
      <div className="flex gap-2 mb-2" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full ${i <= stepIndex ? "bg-green-600" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Step {stepIndex + 1} of {TOTAL_STEPS}
      </p>

      <StepComponent data={data} onChange={updateData} headingRef={headingRef} />

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="px-4 py-2 text-sm rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext()}
          className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {stepIndex === TOTAL_STEPS - 1 ? "See matches" : "Continue"}
        </button>
      </div>
    </div>
  );
}
