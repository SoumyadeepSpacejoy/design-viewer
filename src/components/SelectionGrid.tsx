"use client";

import React from "react";

interface SelectionGridProps {
  onSelect: (feature: "ai-designs" | "push-notifications") => void;
}

export default function SelectionGrid({ onSelect }: SelectionGridProps) {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-thin text-pink-100 tracking-tighter mb-4 text-pink-shadow uppercase">
          Choose Your{" "}
          <span className="text-pink-400 font-light underline decoration-pink-500/30 underline-offset-8">
            Service
          </span>
        </h2>
        <p className="text-pink-300/40 font-light max-w-xl mx-auto uppercase text-[10px] tracking-[0.2em]">
          SELECT A E TO EXPLORE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Push Notifications Card */}
        <div
          className="group relative bg-black/40 rounded-[3rem] p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale opacity-0 stagger-1"
          onClick={() => onSelect("push-notifications")}
        >
          {/* ... neon glow and content ... */}
          {/* Neon Glow on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative mb-10 p-8 bg-black/60 rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <svg
              className="w-12 h-12 text-pink-500/60 group-hover:text-pink-400 transition-colors drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
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

          <h3 className="relative text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
            Push Notifications
          </h3>
          <p className="relative text-pink-300/40 font-light leading-relaxed text-sm uppercase tracking-wider text-center">
            REAL-TIME DATA STREAMS AND TREND ALERTS
          </p>

          <div className="relative mt-10 mt-auto pt-6">
            <span className="text-[10px] font-bold text-pink-500 opacity-60 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 uppercase tracking-[0.3em]">
              Initialize Link →
            </span>
          </div>
        </div>

        {/* AI Designs Card */}
        <div
          className="group relative bg-black/40 rounded-[3rem] p-12 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center glass-panel animate-fade-in-scale opacity-0 stagger-2"
          onClick={() => onSelect("ai-designs")}
        >
          {/* Neon Glow on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative mb-10 p-8 bg-black/60 rounded-[2rem] border border-pink-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner group-hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <svg
              className="w-12 h-12 text-pink-400 group-hover:text-pink-300 transition-colors drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <div className="absolute top-2 right-2 w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899] animate-pulse"></div>
          </div>

          <h3 className="relative text-2xl font-light text-pink-100 mb-4 group-hover:text-pink-400 transition-colors tracking-tight text-pink-shadow">
            AI Designs
          </h3>
          <p className="relative text-pink-300/40 font-light leading-relaxed text-sm uppercase tracking-wider text-center">
            NEURAL GENERATED INTERIOR ARCHITECTURES
          </p>

          <div className="relative mt-10 mt-auto pt-6">
            <span className="text-[10px] font-bold text-pink-400 opacity-60 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 uppercase tracking-[0.3em]">
              Execute Program →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
