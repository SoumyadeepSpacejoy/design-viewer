import { Portal } from "solid-js/web";
import { createMemo, createSignal, For, Show } from "solid-js";
import { createTimeTrackerState } from "~/lib/clientApi";

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

export default function CreateTaskModal(props: CreateTaskModalProps) {
  const [tag, setTag] = createSignal("");
  const [customTag, setCustomTag] = createSignal("");
  const [note, setNote] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const availableTags = createMemo(() => {
    const pkg = props.packageName?.toLowerCase() || "";

    let normalizedPkg = "";
    if (pkg.includes("euphoria")) normalizedPkg = "euphoria";
    else if (pkg.includes("bliss")) normalizedPkg = "bliss";
    else if (pkg.includes("delight")) normalizedPkg = "delight";

    const pTags = PACKAGE_TAGS[normalizedPkg] || [];
    return {
      package: pTags,
      common: COMMON_TAGS.filter((t) => !pTags.includes(t)),
    };
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const finalTag = tag() === "Other" ? customTag().trim() : tag();

    if (!finalTag) {
      setError("Please select or enter a tag");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createTimeTrackerState(props.trackerId, finalTag, note().trim());
      setTag("");
      setCustomTag("");
      setNote("");
      props.onTaskCreated();
    } catch (err) {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting()) {
      setTag("");
      setCustomTag("");
      setNote("");
      setError("");
      props.onClose();
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal mount={document.body}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="fixed inset-0" onClick={handleClose} />

          <div
            class="card p-6 w-full max-w-lg mx-4 shadow-xl animate-fade-in-scale relative z-10 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Create New Task</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  {props.packageName ? `${props.packageName} package` : "Standard workflow"}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting()}
                class="btn btn-ghost btn-sm btn-icon"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} class="flex flex-col flex-1 overflow-hidden">
              <div class="space-y-4 overflow-y-auto pr-1 flex-1 pb-4">
                {/* Tag Select */}
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">
                    Task Stage <span class="text-destructive">*</span>
                  </label>
                  <select
                    value={tag()}
                    onChange={(e) => setTag(e.currentTarget.value)}
                    disabled={isSubmitting()}
                    class="input w-full"
                  >
                    <option value="" disabled>
                      Choose a task stage...
                    </option>
                    <Show when={availableTags().package.length > 0}>
                      <optgroup label={props.packageName}>
                        <For each={availableTags().package}>
                          {(t) => <option value={t}>{t}</option>}
                        </For>
                      </optgroup>
                    </Show>
                    <optgroup label="Common">
                      <For each={availableTags().common}>
                        {(t) => <option value={t}>{t}</option>}
                      </For>
                      <option value="Other">Other (custom)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Custom Tag */}
                <Show when={tag() === "Other"}>
                  <div class="space-y-1.5">
                    <label class="block text-sm font-medium text-foreground">
                      Custom Tag <span class="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      autofocus
                      value={customTag()}
                      onInput={(e) => setCustomTag(e.currentTarget.value)}
                      class="input w-full"
                      placeholder="Enter custom task tag..."
                    />
                  </div>
                </Show>

                {/* Note */}
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">
                    Note <span class="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    value={note()}
                    onInput={(e) => setNote(e.currentTarget.value)}
                    rows={3}
                    class="input w-full resize-none"
                    placeholder="Add a note about this task..."
                  />
                </div>

                <Show when={error()}>
                  <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm flex items-center gap-2">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error()}
                  </div>
                </Show>
              </div>

              <div class="flex gap-3 pt-4 border-t border-border shrink-0">
                <button type="button" onClick={handleClose} class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting() || !tag() || (tag() === "Other" && !customTag().trim())
                  }
                  class="btn btn-primary flex-[1.5]"
                >
                  {isSubmitting() ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
