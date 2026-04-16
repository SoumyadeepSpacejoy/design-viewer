"use client";

import { useEffect, useState } from "react";

interface SuccessToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function SuccessToast({ message, duration = 4000, onClose }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-up">
      <div className="card px-5 py-3 flex items-center gap-3 shadow-xl border-success/20">
        <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground">{message}</span>
      </div>
    </div>
  );
}
