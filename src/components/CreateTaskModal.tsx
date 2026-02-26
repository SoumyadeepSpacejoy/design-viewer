"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto animate-fade-in flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div
        className="relative w-full max-w-lg glass-panel rounded-[2.5rem] p-8 sm:p-10 border border-border shadow-2xl animate-fade-in-scale max-h-[90vh] flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-8 right-8 p-3 bg-primary/5 hover:bg-primary/20 rounded-2xl text-primary/60 transition-all border border-transparent hover:border-primary/20 disabled:opacity-50 z-10"
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

        {/* Header */}
        <div className="mb-6 shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Create New <span className="text-primary">Task</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse"></span>
            <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.2em]">
              {packageName ? `${packageName} Protocol` : "Standard Workflow"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="space-y-6 overflow-y-auto pr-2 flex-1 pb-4 custom-scrollbar">
            {/* Tag Select */}
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4">
                Operational Stage *
              </label>
              <div className="relative">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-muted/40 border-2 border-border/50 rounded-2xl focus:outline-none focus:border-primary/40 transition-all text-foreground appearance-none cursor-pointer font-bold"
                >
                  <option value="" disabled>
                    Choose a workflow stage...
                  </option>
                  {availableTags.package.length > 0 && (
                    <optgroup label={`${packageName} Context`}>
                      {availableTags.package.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Global Protocol">
                    {availableTags.common.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="Other">Custom Designation / Other</option>
                  </optgroup>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-primary/40"
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

            {/* Custom Tag */}
            {tag === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4">
                  Custom Descriptor *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="w-full px-6 py-4 bg-muted/40 border-2 border-border/50 rounded-2xl focus:outline-none focus:border-primary/40 text-foreground transition-all font-bold"
                  placeholder="Enter custom task stage..."
                />
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4">
                Session Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full px-6 py-4 bg-muted/40 border-2 border-border/50 rounded-2xl focus:outline-none focus:border-primary/40 transition-all text-foreground resize-none font-medium text-sm leading-relaxed"
                placeholder="Detail your progress or findings..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2">
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
            )}
          </div>

          <div className="flex gap-4 pt-6 mt-4 border-t border-border/50 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-4 bg-muted/50 hover:bg-muted border border-border rounded-2xl text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || !tag || (tag === "Other" && !customTag.trim())
              }
              className="flex-[1.5] px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Initializing..." : "Initialize Task"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
