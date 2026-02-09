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
import RenderService from "@/components/RenderService";

export default function HomeClient() {
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedFeature = searchParams.get("feature") as
    | "ai-designs"
    | "push-notifications"
    | "my-project-tracker"
    | "track-designers"
    | "render"
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
      | "track-designers"
      | "render",
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
      case "render":
        return "Render";
      default:
        return feature;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <UserMenu />

      {showSuccess && (
        <SuccessToast
          message="Logged in successfully"
          onClose={() => setShowSuccess(false)}
        />
      )}

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        {selectedFeature && (
          <div className="mb-12 sm:mb-20">
            <nav className="flex items-center flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.25em]">
              <button
                onClick={handleBack}
                className="text-muted-foreground/60 hover:text-primary transition-all flex items-center gap-2 group"
              >
                <div className="w-5 h-5 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </div>
                Selection
              </button>
              <span className="text-border/60">•</span>
              <button
                onClick={() => updateSubItem(null)}
                className={`transition-all px-2.5 py-1.5 rounded-lg ${!activeSubItem ? "text-primary bg-primary/5 shadow-sm" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"}`}
                disabled={!activeSubItem}
              >
                {getFeatureName(selectedFeature)}
              </button>
              {activeSubItem && (
                <>
                  <span className="text-border/60">•</span>
                  <span className="text-primary truncate max-w-[400px] bg-primary/5 px-2.5 py-1.5 rounded-lg">
                    {activeSubItem.name}
                  </span>
                </>
              )}
            </nav>
          </div>
        )}

        <div className="relative">
          {!selectedFeature ? (
            <div className="animate-fade-in-scale">
              <SelectionGrid onSelect={handleSelect} />
            </div>
          ) : (
            <div className="animate-fade-in-scale">
              {selectedFeature === "ai-designs" && <DesignFeed />}
              {selectedFeature === "my-project-tracker" && (
                <ProjectTracker
                  activeSubItemId={activeSubItem?.id}
                  onSubItemSelect={updateSubItem}
                />
              )}
              {selectedFeature === "track-designers" &&
                (activeSubItem ? (
                  <AdminTrackerDetail trackerId={activeSubItem.id} />
                ) : (
                  <DesignerTrackerDashboard onSelect={updateSubItem} />
                ))}
              {selectedFeature === "render" && <RenderService />}
              {selectedFeature === "push-notifications" && <NotificationFeed />}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-border/10">
        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/20"></div>
          <div className="w-2 h-2 rounded-full bg-primary/20"></div>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/20"></div>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.5em] opacity-50">
          Spacejoy AI • {new Date().getFullYear()} • Secure Portal
        </p>
      </footer>
    </div>
  );
}
