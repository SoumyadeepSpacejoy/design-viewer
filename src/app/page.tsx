"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DesignFeed from "@/components/DesignFeed";
import SelectionGrid from "@/components/SelectionGrid";
import UserMenu from "@/components/UserMenu";
import SuccessToast from "@/components/SuccessToast";

function HomeContent() {
  const [selectedFeature, setSelectedFeature] = useState<
    "ai-designs" | "push-notifications" | null
  >(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Clean up the URL without a full refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleSelect = (feature: "ai-designs" | "push-notifications") => {
    setSelectedFeature(feature);
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-visible">
        {!selectedFeature ? (
          <div className="animate-fade-in-scale opacity-0">
            <SelectionGrid onSelect={handleSelect} />
          </div>
        ) : selectedFeature === "ai-designs" ? (
          <div className="animate-fade-in-scale opacity-0">
            <div className="flex justify-between items-center mb-16 px-6">
              <button
                onClick={() => setSelectedFeature(null)}
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
          <div className="py-20 text-center animate-fade-in-scale opacity-0">
            <div className="max-w-md mx-auto glass-panel p-16 rounded-[4rem] border border-pink-500/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-pink-500/5 blur-[50px] rounded-full -z-10"></div>

              <div className="w-24 h-24 bg-black/60 glass-panel rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-pink-500 border border-pink-500/20 group hover:scale-105 transition-transform duration-500">
                <svg
                  className="w-12 h-12 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-light text-pink-100 mb-6 tracking-tight text-pink-shadow uppercase">
                Push Notifications
              </h3>
              <p className="text-pink-300/40 font-light mb-12 uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                NEURAL COMM-LINK OFFLINE.
                <br />
                STAY TUNED FOR UPDATES.
              </p>
              <button
                onClick={() => setSelectedFeature(null)}
                className="w-full py-5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(236,72,153,0.3)] transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              >
                Go Back
              </button>
            </div>
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
        <p className="text-[10px] text-pink-500/30 font-bold uppercase tracking-[0.4em]">
          Spacejoy AI • {new Date().getFullYear()} • Secure Portal
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
