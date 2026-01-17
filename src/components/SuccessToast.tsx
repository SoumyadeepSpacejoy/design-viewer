"use client";

import { useEffect, useState } from "react";

interface SuccessToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function SuccessToast({
  message,
  duration = 4000,
  onClose,
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 500); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-scale opacity-0">
      <div className="glass-panel px-8 py-4 rounded-2xl flex items-center gap-4 border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/40">
          <svg
            className="w-6 h-6 text-pink-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-pink-100 font-medium tracking-tight">
            {message}
          </span>
          <span className="text-pink-400/60 text-xs font-light uppercase tracking-widest">
            Access Granted • Portal Secured
          </span>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent -translate-x-full animate-[glassShimmer_3s_infinite] pointer-events-none"></div>
      </div>
    </div>
  );
}
