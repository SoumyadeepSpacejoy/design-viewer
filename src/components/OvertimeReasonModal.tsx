"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateOvertimeReason } from "@/app/clientApi";

interface OvertimeReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerId: string;
  onReasonSubmitted: () => void;
}

export default function OvertimeReasonModal({
  isOpen,
  onClose,
  trackerId,
  onReasonSubmitted,
}: OvertimeReasonModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateOvertimeReason(trackerId, reason);
      setReason("");
      onReasonSubmitted();
      onClose();
    } catch (err) {
      setError("Failed to submit reason. Please try again.");
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
              Overtime Report
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Required project documentation
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
              Reason for overtime
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain the cause for overtime..."
              required
              rows={4}
              className="input w-full resize-none"
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
              disabled={isSubmitting || !reason.trim()}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Reason"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
