"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DesignFeed from "@/components/DesignFeed";
import SelectionGrid from "@/components/SelectionGrid";
import UserMenu from "@/components/UserMenu";
import SuccessToast from "@/components/SuccessToast";
import NotificationFeed from "@/components/NotificationFeed";

export default function HomeClient() {
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedFeature = searchParams.get("feature") as
    | "ai-designs"
    | "push-notifications"
    | null;

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

  const handleSelect = (feature: "ai-designs" | "push-notifications") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("feature", feature);
    router.push(`?${params.toString()}`);
  };

  const handleBack = () => {
    router.push("/");
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
        {!selectedFeature ? (
          <div className="animate-fade-in-scale">
            <SelectionGrid onSelect={handleSelect} />
          </div>
        ) : selectedFeature === "ai-designs" ? (
          <div className="animate-fade-in-scale">
            <div className="flex justify-between items-center mb-10 sm:mb-16 px-4 sm:px-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-pink-400/60 hover:text-pink-400 transition-all group"
              >
                <div className="p-3 bg-black/40 glass-panel rounded-xl group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
                Return to Selection
              </button>
            </div>
            <DesignFeed />
          </div>
        ) : (
          <div className="animate-fade-in-scale">
            <div className="flex justify-between items-center mb-10 sm:mb-16 px-4 sm:px-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-pink-400/60 hover:text-pink-400 transition-all group"
              >
                <div className="p-3 bg-black/40 glass-panel rounded-xl group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
                Return to Selection
              </button>
            </div>
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
