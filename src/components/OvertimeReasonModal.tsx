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
                Overtime Report
              </h2>
              <p className="text-muted-foreground/40 text-[10px] uppercase tracking-[0.2em] mt-1 font-black">
                Required project documentation
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-primary/5 hover:bg-primary/20 rounded-2xl text-primary/60 transition-all border border-transparent hover:border-primary/20"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">
                Provide operational context for budget variance
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain the cause for overtime..."
                required
                rows={4}
                className="w-full bg-muted/40 border-2 border-border/50 rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/40 transition-all resize-none font-medium text-sm leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[11px] font-bold px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Authorize Project Variance"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
