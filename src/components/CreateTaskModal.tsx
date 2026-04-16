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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={handleClose}
      ></div>

      <div
        className="card p-6 w-full max-w-lg mx-4 shadow-xl animate-fade-in-scale relative z-10 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Create New Task
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {packageName ? `${packageName} package` : "Standard workflow"}
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-4">
            {/* Tag Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Task Stage <span className="text-destructive">*</span>
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                disabled={isSubmitting}
                className="input w-full"
              >
                <option value="" disabled>
                  Choose a task stage...
                </option>
                {availableTags.package.length > 0 && (
                  <optgroup label={`${packageName}`}>
                    {availableTags.package.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Common">
                  {availableTags.common.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="Other">Other (custom)</option>
                </optgroup>
              </select>
            </div>

            {/* Custom Tag */}
            {tag === "Other" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Custom Tag <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="input w-full"
                  placeholder="Enter custom task tag..."
                />
              </div>
            )}

            {/* Note */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Note <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="input w-full resize-none"
                placeholder="Add a note about this task..."
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4 shrink-0"
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

          <div className="flex gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || !tag || (tag === "Other" && !customTag.trim())
              }
              className="btn btn-primary flex-[1.5]"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
