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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Update Task Time
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Adjust hours, minutes, and seconds
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
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
          <div className="grid grid-cols-3 gap-4">
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
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMinutes(Number.isNaN(value) ? 0 : Math.max(0, value));
                }}
                className="input w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
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
                className="input w-full"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-md border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              New total time
            </p>
            <p className="text-primary font-semibold text-lg tabular-nums">
              {hours}h {minutes}m {seconds}s
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
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
