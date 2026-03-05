"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createProjectTracker } from "@/app/clientApi";

interface AddTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackerAdded: () => void;
}

export default function AddTrackerModal({
  isOpen,
  onClose,
  onTrackerAdded,
}: AddTrackerModalProps) {
  const [projectId, setProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setProjectId("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedId = projectId.trim();
    if (!trimmedId) {
      setError("Please enter a project ID.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProjectTracker(trimmedId);
      if (result) {
        onTrackerAdded();
        onClose();
      } else {
        setError("Failed to add tracker. Please check the project ID and try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <h2 className="text-2xl font-bold text-foreground">Add Tracker</h2>
              <p className="text-muted-foreground/40 text-xs uppercase tracking-widest mt-1 font-bold">
                Link a project to time tracking
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
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">
                Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter project ID..."
                className="w-full bg-muted/40 border border-border rounded-2xl px-5 py-4 text-foreground focus:outline-none focus:border-primary/40 transition-all font-medium placeholder-muted-foreground/30"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-[11px] font-bold px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !projectId.trim()}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding Tracker..." : "Add Tracker"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
