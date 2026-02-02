"use client";

import { useState } from "react";
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

  if (!isOpen) return null;

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
        <div className="relative w-full max-w-md glass-panel rounded-3xl border border-pink-500/20 shadow-2xl animate-fade-in-scale overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-light text-pink-100">
                  Overtime Reason
                </h2>
                <p className="text-pink-300/40 text-xs uppercase tracking-widest mt-1">
                  Required for project tracking
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-pink-300/40 hover:text-pink-300"
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
              <div>
                <label className="block text-[10px] font-black text-pink-300/40 uppercase tracking-[0.2em] mb-2 px-1">
                  Why did this project go over budget?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly explain the cause for overtime..."
                  required
                  rows={4}
                  className="w-full bg-black/40 border border-pink-500/10 rounded-2xl px-4 py-3 text-pink-100 placeholder:text-pink-100/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-xs px-1">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Submit Reason"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
