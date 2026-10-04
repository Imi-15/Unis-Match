export default function Landing({ onGetStarted, onBrowseScholarships }) {
  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="bg-gradient-to-br from-green-50 to-gray-50 rounded-3xl p-8 mb-6">
        {/* Original illustration, not a photo -- a hotlinked stock photo
            needs internet to load and adds real weight versus an inline
            SVG, which fights the app's offline/low-data pledge even as a
            single image. Designed to read as "secondary school student"
            (backpack + exercise book + pencil) rather than "university
            graduate holding textbooks" -- that's who's actually using
            this screen: SS3 students sizing up what comes after JAMB. */}
        <svg width="150" height="130" viewBox="0 0 150 130" className="mx-auto mb-3" aria-hidden="true">
          {/* head + body */}
          <circle cx="75" cy="30" r="15" fill="#16a34a" opacity="0.85" />
          <path d="M52 108 Q52 72 75 72 Q98 72 98 108 Z" fill="#16a34a" opacity="0.85" />
          {/* backpack, peeking out behind one shoulder */}
          <rect x="95" y="68" width="26" height="34" rx="6" fill="#fbbf24" />
          <rect x="101" y="74" width="14" height="10" rx="2" fill="#fde68a" />
          <path d="M95 74 Q90 72 90 80" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          {/* exercise book held in front, green cover like the real thing */}
          <rect x="58" y="86" width="30" height="24" rx="2" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
          <line x1="63" y1="92" x2="83" y2="92" stroke="#16a34a" strokeWidth="1.5" opacity="0.6" />
          <line x1="63" y1="98" x2="83" y2="98" stroke="#16a34a" strokeWidth="1.5" opacity="0.6" />
          <line x1="63" y1="104" x2="78" y2="104" stroke="#16a34a" strokeWidth="1.5" opacity="0.6" />
          {/* pencil, tucked beside the book */}
          <rect x="34" y="88" width="6" height="26" rx="2" fill="#fbbf24" transform="rotate(-18 37 101)" />
          <path d="M31 90 L34 85 L40 88 Z" fill="#78350f" transform="rotate(-18 37 101)" />
          <line x1="20" y1="122" x2="130" y2="122" stroke="#16a34a" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
        </svg>
        <h1 className="text-xl font-semibold mb-2">Your next step, sorted</h1>
        <p className="text-sm text-gray-600">
          For SS3 students getting ready for JAMB -- find where you fit, score or no score yet.
        </p>
      </div>

      <button
        type="button"
        onClick={onGetStarted}
        className="w-full py-3 rounded-xl bg-green-600 text-white font-medium mb-3"
      >
        Find my university matches
      </button>

      <button
        type="button"
        onClick={onBrowseScholarships}
        className="w-full py-3 rounded-xl border font-medium text-gray-700"
      >
        Just browse scholarships
      </button>

      <p className="text-xs text-gray-400 mt-4">
        University matching takes about a minute. Scholarships don't need a JAMB score.
      </p>
    </div>
  );
}
