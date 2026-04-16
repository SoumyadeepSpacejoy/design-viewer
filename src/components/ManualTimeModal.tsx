"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Update Time Spent
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manual time adjustment
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-icon"
          >
            <svg
              className="w-5 h-5"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Hours
              </label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="input w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="input w-full"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-md border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              New total time
            </p>
            <p className="text-primary font-semibold text-lg tabular-nums">
              {hours}h {minutes}m
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? "Updating..." : "Update Time"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
