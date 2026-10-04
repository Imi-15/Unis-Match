import { useState } from "react";
import Landing from "./components/Landing.jsx";
import Wizard from "./components/Wizard.jsx";
import Dashboard from "./components/Dashboard.jsx";

// Three screens: landing -> wizard -> dashboard. Scholarships can be
// reached straight from landing, skipping the wizard, since they aren't
// matched against a student profile the way universities are.
export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "wizard" | "dashboard"
  const [profile, setProfile] = useState(null);
  const [initialTab, setInitialTab] = useState("universities");

  function goHome() {
    setView("landing");
  }

  function startWizard() {
    setView("wizard");
  }

  function browseScholarships() {
    setInitialTab("scholarships");
    setView("dashboard");
  }

  function handleWizardComplete(completedProfile) {
    setProfile(completedProfile);
    setInitialTab("universities");
    setView("dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-center py-6">
        <button type="button" onClick={goHome} className="text-xl font-semibold">
          Uni &amp; Scholarship Matcher
        </button>
      </header>

      <main>
        {view === "landing" && <Landing onGetStarted={startWizard} onBrowseScholarships={browseScholarships} />}

        {view === "wizard" && <Wizard onComplete={handleWizardComplete} />}

        {view === "dashboard" && (
          <Dashboard profile={profile} initialTab={initialTab} onRestart={startWizard} onStartWizard={startWizard} />
        )}
      </main>
    </div>
  );
}
