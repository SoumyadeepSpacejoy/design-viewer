"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DesignFeed from "@/components/DesignFeed";
import SelectionGrid from "@/components/SelectionGrid";
import UserMenu from "@/components/UserMenu";
import SuccessToast from "@/components/SuccessToast";
import NotificationFeed from "@/components/NotificationFeed";
import ProjectTracker from "@/components/ProjectTracker";
import DesignerTrackerDashboard from "@/components/DesignerTrackerDashboard";
import AdminTrackerDetail from "@/components/AdminTrackerDetail";

export default function HomeClient() {
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedFeature = searchParams.get("feature") as
    | "ai-designs"
    | "push-notifications"
    | "my-project-tracker"
    | "track-designers"
    | null;

  const subItemId = searchParams.get("subItemId");
  const subItemName = searchParams.get("subItemName") || "";

  // Directly derived from URL to ensure perfect persistence and no redundant renders
  const activeSubItem = subItemId ? { id: subItemId, name: subItemName } : null;

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Clean up the URL without a full refresh
      const params = new URLSearchParams(window.location.search);
      params.delete("success");
      const newQuery = params.toString();
      const newUrl = newQuery
        ? `${window.location.pathname}?${newQuery}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  // Handle setting active sub item with URL persistence
  const updateSubItem = (id: string | null, name?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("subItemId", String(id));
      if (name) params.set("subItemName", String(name));
    } else {
      params.delete("subItemId");
      params.delete("subItemName");
    }
    router.push(`?${params.toString()}`);
  };

  // Switch between main features
  const handleSelect = (
    feature:
      | "ai-designs"
      | "push-notifications"
      | "my-project-tracker"
      | "track-designers",
  ) => {
    const params = new URLSearchParams();
    params.set("feature", feature);
    router.push(`?${params.toString()}`);
  };

  const handleBack = () => {
    router.push("/");
  };

  const getFeatureName = (feature: string) => {
    switch (feature) {
      case "ai-designs":
        return "AI Designs";
      case "push-notifications":
        return "Push Notifications";
      case "my-project-tracker":
        return "Project Tracker";
      case "track-designers":
        return "Track Designers";
      default:
        return feature;
    }
  };

  return (
    <div className="min-h-screen bg-black text-pink-400 font-sans selection:bg-pink-500/30">
      <UserMenu />

      {showSuccess && (
        <SuccessToast
          message="Logged in successfully"
          onClose={() => setShowSuccess(false)}
        />
      )}
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/5 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-900/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-10 sm:py-20 overflow-x-hidden">
        {selectedFeature && (
          <div className="mb-10 sm:mb-16 px-4 sm:px-6">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
              <button
                onClick={handleBack}
                className="text-pink-400/40 hover:text-pink-400 transition-colors"
              >
                Selection
              </button>
              <span className="text-pink-500/20">/</span>
              <button
                onClick={() => updateSubItem(null)}
                className={`${!activeSubItem ? "text-pink-400" : "text-pink-400/40 hover:text-pink-400"} transition-colors`}
                disabled={!activeSubItem}
              >
                {getFeatureName(selectedFeature)}
              </button>
              {activeSubItem && (
                <>
                  <span className="text-pink-500/20">/</span>
                  <span className="text-pink-400 truncate max-w-[200px]">
                    {activeSubItem.name}
                  </span>
                </>
              )}
            </nav>
          </div>
        )}

        {!selectedFeature ? (
          <div className="animate-fade-in-scale">
            <SelectionGrid onSelect={handleSelect} />
          </div>
        ) : selectedFeature === "ai-designs" ? (
          <div className="animate-fade-in-scale">
            <DesignFeed />
          </div>
        ) : selectedFeature === "my-project-tracker" ? (
          <div className="animate-fade-in-scale">
            <ProjectTracker
              activeSubItemId={activeSubItem?.id}
              onSubItemSelect={updateSubItem}
            />
          </div>
        ) : selectedFeature === "track-designers" ? (
          <div className="animate-fade-in-scale">
            {activeSubItem ? (
              <AdminTrackerDetail trackerId={activeSubItem.id} />
            ) : (
              <DesignerTrackerDashboard onSelect={updateSubItem} />
            )}
          </div>
        ) : (
          <div className="animate-fade-in-scale">
            <NotificationFeed />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 text-center">
        <div className="flex items-center justify-center gap-4 opacity-10 mb-6">
          <div className="w-12 h-px bg-pink-500"></div>
          <div className="w-2 h-2 rounded-full bg-pink-500"></div>
          <div className="w-12 h-px bg-pink-500"></div>
        </div>
        <p className="text-[8px] sm:text-[10px] text-pink-500/30 font-bold uppercase tracking-widest sm:tracking-[0.4em]">
          Spacejoy AI • {new Date().getFullYear()} • Secure Portal
        </p>
      </footer>
    </div>
  );
}
