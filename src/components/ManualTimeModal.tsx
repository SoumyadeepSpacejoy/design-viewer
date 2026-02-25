"use client";

import { useState } from "react";
import { updateManualTime } from "@/app/clientApi";

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentSeconds: number;
  onTimeUpdated: () => void;
}

export default function ManualTimeModal({
  isOpen,
  onClose,
  projectId,
  currentSeconds,
  onTimeUpdated,
}: ManualTimeModalProps) {
  const currentHours = Math.floor(currentSeconds / 3600);
  const currentMinutes = Math.floor((currentSeconds % 3600) / 60);

  const [hours, setHours] = useState(currentHours);
  const [minutes, setMinutes] = useState(currentMinutes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSeconds = hours * 3600 + minutes * 60;

    if (!projectId) {
      setError("Project ID is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateManualTime(projectId, totalSeconds);
      onTimeUpdated();
      onClose();
    } catch (err) {
      setError("Failed to update time. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Modal Container */}
        <div className="relative w-full max-w-md glass-panel rounded-3xl border border-border shadow-2xl animate-fade-in-scale overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Update Time Spent
                </h2>
                <p className="text-muted-foreground/40 text-xs uppercase tracking-widest mt-1">
                  Manual adjustment
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground/40 hover:text-muted-foreground"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-2 px-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-2 px-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">
                  New Total Time
                </p>
                <p className="text-primary font-bold text-lg">
                  {hours}h {minutes}m
                </p>
              </div>

              {error && <p className="text-red-400 text-xs px-1">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Update Time"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
