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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add Tracker</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Link a project to time tracking
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
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Project ID
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID..."
              className="input w-full"
              autoFocus
            />
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
              disabled={isSubmitting || !projectId.trim()}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? "Adding..." : "Add Tracker"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
