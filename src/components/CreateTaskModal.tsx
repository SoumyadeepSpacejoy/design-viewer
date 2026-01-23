"use client";

import { useState, useMemo, useEffect } from "react";
import { createTimeTrackerState } from "@/app/clientApi";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerId: string;
  packageName?: string;
  onTaskCreated: () => void;
}

const COMMON_TAGS = [
  "Administrative",
  "Design",
  "Meeting",
  "Research",
  "Client Call",
  "Documentation",
  "Quality Check",
];

const PACKAGE_TAGS: Record<string, string[]> = {
  delight: [
    "Initial Concept 1",
    "Revision 1",
    "Revision 2",
    "Customer Communication",
    "Product Sourcing",
    "Additional Revision CS",
    "Additional Revision Paid",
  ],
  bliss: [
    "30 Minute Consultation Call",
    "Initial Concept 1",
    "Initial Concept 2",
    "Revision 1",
    "Revision 2",
    "Product Sourcing",
    "Client Communication",
    "Additional Revision CS",
    "Additional Revision Paid",
  ],
  euphoria: [
    "Initial Concept 1",
    "Initial Concept 2",
    "Revision 1",
    "Revision 2",
    "Revision 3",
    "Revision 4",
    "1 Hour Consultation Call",
    "Live Revision",
    "Client Communication",
    "Product Sourcing",
    "Additional Revision CS",
    "Additional Revision Paid",
  ],
};

export default function CreateTaskModal({
  isOpen,
  onClose,
  trackerId,
  packageName,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [tag, setTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableTags = useMemo(() => {
    const pkg = packageName?.toLowerCase() || "";

    let normalizedPkg = "";
    if (pkg.includes("euphoria")) normalizedPkg = "euphoria";
    else if (pkg.includes("bliss")) normalizedPkg = "bliss";
    else if (pkg.includes("delight")) normalizedPkg = "delight";

    const pTags = PACKAGE_TAGS[normalizedPkg] || [];
    return {
      package: pTags,
      common: COMMON_TAGS.filter((t) => !pTags.includes(t)),
    };
  }, [packageName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTag = tag === "Other" ? customTag.trim() : tag;

    if (!finalTag) {
      setError("Please select or enter a tag");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createTimeTrackerState(trackerId, finalTag, note.trim());
      setTag("");
      setCustomTag("");
      setNote("");
      onTaskCreated();
    } catch (err) {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTag("");
      setCustomTag("");
      setNote("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Centering wrapper */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative w-full max-w-lg glass-panel rounded-[2rem] p-8 border border-pink-500/20 shadow-2xl animate-fade-in-scale max-h-[90vh] flex flex-col">
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-6 right-6 p-2 text-pink-400/60 hover:text-pink-400 transition-colors disabled:opacity-50 z-10"
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
          <div className="mb-6 shrink-0 text-center sm:text-left">
            <h2 className="text-2xl font-light text-pink-100 mb-2">
              Create New Task
            </h2>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></span>
              <p className="text-pink-300/60 text-sm font-medium tracking-wide">
                {packageName
                  ? `Service: ${packageName}`
                  : "Project Time Tracking"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 overflow-y-auto pr-1 flex-1"
          >
            {/* Tag Select */}
            <div>
              <label className="block text-[10px] font-black text-pink-400/80 uppercase tracking-[0.2em] mb-3">
                Select Tag *
              </label>
              <div className="relative">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-4 bg-black/60 border border-pink-500/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all text-pink-100 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-zinc-900">
                    Choose a workflow stage...
                  </option>

                  {availableTags.package.length > 0 && (
                    <optgroup
                      label={`${packageName} Specific`}
                      className="bg-zinc-900 text-pink-400"
                    >
                      {availableTags.package.map((t) => (
                        <option
                          key={t}
                          value={t}
                          className="bg-zinc-900 text-pink-100"
                        >
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup
                    label="General Tags"
                    className="bg-zinc-900 text-pink-400"
                  >
                    {availableTags.common.map((t) => (
                      <option
                        key={t}
                        value={t}
                        className="bg-zinc-900 text-pink-100"
                      >
                        {t}
                      </option>
                    ))}
                    <option
                      value="Other"
                      className="bg-zinc-900 text-pink-300 font-bold"
                    >
                      Custom Tag / Other
                    </option>
                  </optgroup>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-pink-500/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom Tag Input */}
            {tag === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-pink-400/80 uppercase tracking-[0.2em] mb-3">
                  Custom Tag Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-4 bg-black/40 border border-pink-500/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-pink-100 placeholder-pink-900/40 transition-all"
                  placeholder="Enter custom task stage..."
                />
              </div>
            )}

            {/* Note */}
            <div>
              <label
                htmlFor="note"
                className="block text-[10px] font-black text-pink-400/80 uppercase tracking-[0.2em] mb-3"
              >
                Session Note (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-4 py-4 bg-black/40 border border-pink-500/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all text-pink-100 placeholder-pink-900/40 resize-none resize-y min-h-[100px]"
                placeholder="Detail your progress or findings..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-sm rounded-2xl animate-in fade-in slide-in-from-top-2 shrink-0">
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
            <div className="flex gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 bg-black/40 border border-pink-500/10 rounded-2xl text-pink-400/60 hover:text-pink-400 hover:border-pink-500/30 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !tag || (tag === "Other" && !customTag.trim())
                }
                className="flex-1 px-6 py-4 bg-gradient-to-br from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Creating
                  </div>
                ) : (
                  "Initialize Task"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
