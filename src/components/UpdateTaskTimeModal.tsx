"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface UpdateTaskTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentSeconds: number;
  onSubmit: (totalSeconds: number) => Promise<void> | void;
  isSubmitting?: boolean;
}

export default function UpdateTaskTimeModal({
  isOpen,
  onClose,
  taskId,
  currentSeconds,
  onSubmit,
  isSubmitting = false,
}: UpdateTaskTimeModalProps) {
  const currentHours = Math.floor(currentSeconds / 3600);
  const currentMinutes = Math.floor((currentSeconds % 3600) / 60);
  const currentSecondsRemainder = currentSeconds % 60;

  const [hours, setHours] = useState(currentHours);
  const [minutes, setMinutes] = useState(currentMinutes);
  const [seconds, setSeconds] = useState(currentSecondsRemainder);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHours(currentHours);
      setMinutes(currentMinutes);
      setSeconds(currentSecondsRemainder);
      setError(null);
    }
  }, [isOpen, currentHours, currentMinutes, currentSecondsRemainder]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskId) {
      setError("Task ID is missing. Please refresh and try again.");
      return;
    }

    const safeHours = Number.isFinite(hours) && hours >= 0 ? hours : 0;
    const safeMinutes =
      Number.isFinite(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0;
    const safeSeconds =
      Number.isFinite(seconds) && seconds >= 0 && seconds < 60 ? seconds : 0;

    const totalSeconds = safeHours * 3600 + safeMinutes * 60 + safeSeconds;

    try {
      setError(null);
      await onSubmit(totalSeconds);
    } catch (err) {
      console.error("Error updating task time:", err);
      setError("Failed to update task time. Please try again.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto animate-fade-in flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md glass-panel rounded-3xl border border-border shadow-2xl animate-fade-in-scale overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Update Task Time
              </h2>
              <p className="text-muted-foreground/40 text-xs uppercase tracking-widest mt-1 font-bold">
                H / M / S precision control
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-40"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="w-full bg-muted/40 border border-border rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-primary/40 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setMinutes(Number.isNaN(value) ? 0 : Math.max(0, value));
                  }}
                  className="w-full bg-muted/40 border border-border rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-primary/40 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSeconds(Number.isNaN(value) ? 0 : Math.max(0, value));
                  }}
                  className="w-full bg-muted/40 border border-border rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-primary/40 transition-all font-bold"
                />
              </div>
            </div>

            <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl">
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">
                New Aggregated Time
              </p>
              <p className="text-primary font-black text-xl tabular-nums">
                {hours}h {minutes}m {seconds}s
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-[11px] font-bold px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Sync Task Time"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

