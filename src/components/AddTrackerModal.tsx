import { Portal } from "solid-js/web";
import { createEffect, createSignal, Show } from "solid-js";
import { createProjectTracker } from "~/lib/clientApi";

interface AddTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackerAdded: () => void;
}

export default function AddTrackerModal(props: AddTrackerModalProps) {
  const [projectId, setProjectId] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.isOpen) {
      setProjectId("");
      setError(null);
    }
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const trimmedId = projectId().trim();
    if (!trimmedId) {
      setError("Please enter a project ID.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProjectTracker(trimmedId);
      if (result) {
        props.onTrackerAdded();
        props.onClose();
      } else {
        setError("Failed to add tracker. Please check the project ID and try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal mount={document.body}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="fixed inset-0" onClick={() => props.onClose()} />

          <div
            class="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Add Tracker</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Link a project to time tracking
                </p>
              </div>
              <button onClick={() => props.onClose()} class="btn btn-ghost btn-sm btn-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">Project ID</label>
                <input
                  type="text"
                  value={projectId()}
                  onInput={(e) => setProjectId(e.currentTarget.value)}
                  placeholder="Enter project ID..."
                  class="input w-full"
                  autofocus
                />
              </div>

              <Show when={error()}>
                <p class="text-sm text-destructive">{error()}</p>
              </Show>

              <div class="flex gap-3 pt-2">
                <button type="button" onClick={() => props.onClose()} class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting() || !projectId().trim()}
                  class="btn btn-primary flex-1"
                >
                  {isSubmitting() ? "Adding..." : "Add Tracker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
