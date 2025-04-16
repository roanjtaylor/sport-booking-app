// src/app/discover/page.tsx
import DiscoverClient from "./DiscoverClient";

/**
 * Discover page component
 * Serves as the main entry point for facility and lobby discovery
 * Contains tab-based navigation for different view modes
 */
export default function DiscoverPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-gray-600">
          Find sports facilities and open lobbies in your area
        </p>
      </div>

      {/* Client component handles the tab interface and dynamic content */}
      <DiscoverClient />
    </div>
  );
}
