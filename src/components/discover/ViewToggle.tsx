"use client";

type ViewMode = "facilities" | "lobbies";

interface ViewToggleProps {
  currentView: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

export function ViewToggle({ currentView, onToggle }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        onClick={() => onToggle("facilities")}
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
          currentView === "facilities"
            ? "bg-primary-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
        }`}
      >
        Facilities
      </button>
      <button
        type="button"
        onClick={() => onToggle("lobbies")}
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
          currentView === "lobbies"
            ? "bg-primary-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
        }`}
      >
        Lobbies
      </button>
    </div>
  );
}
