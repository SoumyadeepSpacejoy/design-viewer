"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string) => void;
  loading?: boolean;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  loading = false,
}: ScheduleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateTime) {
      const isoString = new Date(dateTime).toISOString();
      onSchedule(isoString);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Schedule Later
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select date and time for delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-icon"
          >
            <svg
              className="w-4 h-4"
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
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Schedule Date & Time
            </label>
            <input
              required
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="input w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              disabled={loading || !dateTime}
              type="submit"
              className="btn btn-primary flex-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
