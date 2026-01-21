"use client";

import React, { useState, useEffect } from "react";

interface SelectionGridProps {
  onSelect: (
    feature:
      | "ai-designs"
      | "push-notifications"
      | "my-project-tracker"
      | "track-designers",
  ) => void;
}

export default function SelectionGrid({ onSelect }: SelectionGridProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    console.log("SelectionGrid - User role from localStorage:", role);
    setUserRole(role);
    setIsLoading(false);
  }, []);

  const isAdminOrOwner = userRole === "admin" || userRole === "owner";
  const isDesigner = userRole === "designer";

  // Show loading state while checking role
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 sm:py-12 px-2 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-pink-400/40 text-xs font-bold uppercase tracking-[0.2em] mt-4">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-2 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-20">
        <h2 className="text-xl sm:text-4xl font-thin text-pink-100 tracking-tight mb-4 text-pink-shadow uppercase px-4 whitespace-normal break-words">
          Choose Your{" "}
          <span className="text-pink-400 font-light underline decoration-pink-500/30 underline-offset-8">
            Service
          </span>
        </h2>
        <p className="text-pink-300/40 font-light max-w-xs mx-auto uppercase text-[8px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] px-4 leading-relaxed">
          SELECT A SERVICE TO EXPLORE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 px-4 sm:px-0">
        {/* My Project Tracker Card - Only for Designers */}
        {isDesigner && (
          <div
            className="group relative bg-black/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale"
            onClick={() => onSelect("my-project-tracker")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative mb-6 p-6 sm:p-8 bg-black/60 rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
              <svg
                className="w-10 h-10 text-pink-500/60 group-hover:text-pink-400 transition-colors drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="relative text-xl sm:text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
              My Project Tracker
            </h3>
            <p className="relative text-pink-300/40 font-light leading-relaxed text-[10px] sm:text-sm uppercase tracking-tight sm:tracking-wider text-center">
              MANAGE YOUR DESIGN PROJECTS AND TIMELINES
            </p>
            <div className="relative mt-auto pt-6">
              <span className="text-[9px] sm:text-[10px] font-bold text-pink-500 opacity-60 group-hover:opacity-100 transition-all duration-500 uppercase tracking-widest">
                Track Projects →
              </span>
            </div>
          </div>
        )}

        {/* Admin/Owner Features */}
        {isAdminOrOwner && (
          <>
            <div
              className="group relative bg-black/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale"
              onClick={() => onSelect("push-notifications")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative mb-6 p-6 sm:p-8 bg-black/60 rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <svg
                  className="w-10 h-10 text-pink-500/60 group-hover:text-pink-400 transition-colors drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="relative text-xl sm:text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
                Push Notifications
              </h3>
              <p className="relative text-pink-300/40 font-light leading-relaxed text-[10px] sm:text-sm uppercase tracking-tight sm:tracking-wider text-center">
                REAL-TIME DATA STREAMS AND TREND ALERTS
              </p>
              <div className="relative mt-auto pt-6">
                <span className="text-[9px] sm:text-[10px] font-bold text-pink-500 opacity-60 group-hover:opacity-100 transition-all duration-500 uppercase tracking-widest">
                  Initialize Link →
                </span>
              </div>
            </div>

            <div
              className="group relative bg-black/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale"
              onClick={() => onSelect("ai-designs")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative mb-6 sm:mb-10 p-6 sm:p-8 bg-black/60 rounded-[1.5rem] sm:rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400 group-hover:text-pink-300 transition-colors drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <h3 className="relative text-xl sm:text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
                AI Designs
              </h3>
              <p className="relative text-pink-300/40 font-light leading-relaxed text-[10px] sm:text-sm uppercase tracking-tight sm:tracking-wider text-center">
                NEURAL GENERATED INTERIOR ARCHITECTURES
              </p>
              <div className="relative mt-auto pt-6">
                <span className="text-[10px] font-bold text-pink-400 opacity-60 group-hover:opacity-100 transition-all duration-500 uppercase tracking-[0.3em]">
                  Execute Program →
                </span>
              </div>
            </div>
            <div
              className="group relative bg-black/40 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale md:col-span-2"
              onClick={() => onSelect("track-designers")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative mb-6 p-6 sm:p-8 bg-black/60 rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <svg
                  className="w-10 h-10 text-pink-500/60 group-hover:text-pink-400 transition-colors drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="relative text-xl sm:text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
                Track Designers
              </h3>
              <p className="relative text-pink-300/40 font-light leading-relaxed text-[10px] sm:text-sm uppercase tracking-tight sm:tracking-wider text-center">
                MANAGE DESIGNER PERFORMANCE
              </p>
              <div className="relative mt-auto pt-6">
                <span className="text-[9px] sm:text-[10px] font-bold text-pink-500/60 uppercase tracking-widest group-hover:text-pink-400 transition-colors">
                  View Designers →
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
