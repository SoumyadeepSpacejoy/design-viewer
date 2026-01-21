"use client";

import { useState } from "react";
import { createTimeTrackerState } from "@/app/clientApi";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerId: string;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  trackerId,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tag.trim()) {
      setError("Task name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createTimeTrackerState(trackerId, tag.trim(), note.trim());
      setTag("");
      setNote("");
      onTaskCreated();
    } catch (err) {
      setError("Failed to create task. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTag("");
      setNote("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-panel rounded-[2rem] p-8 border border-pink-500/20 shadow-2xl animate-fade-in-scale">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 p-2 text-pink-400/60 hover:text-pink-400 transition-colors disabled:opacity-50"
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

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-pink-100 mb-2">
            Create New Task
          </h2>
          <p className="text-pink-300/60 text-sm">
            Start tracking time for a new task
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div>
            <label
              htmlFor="tag"
              className="block text-xs font-semibold text-pink-400/80 uppercase tracking-widest mb-2"
            >
              Task Name *
            </label>
            <input
              id="tag"
              type="text"
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-black/40 border border-pink-500/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all text-pink-100 placeholder-pink-900/50 disabled:opacity-50"
              placeholder="e.g., Concept 1, Design Review, etc."
            />
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="note"
              className="block text-xs font-semibold text-pink-400/80 uppercase tracking-widest mb-2"
            >
              Note (Optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-4 py-3 bg-black/40 border border-pink-500/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all text-pink-100 placeholder-pink-900/50 resize-none disabled:opacity-50"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-sm rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-black/40 border border-pink-500/10 rounded-xl text-pink-400/60 hover:text-pink-400 hover:border-pink-500/30 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-xl font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
