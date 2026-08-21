import { Portal } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import { updateOvertimeReason } from "~/lib/clientApi";

interface OvertimeReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerId: string;
  onReasonSubmitted: () => void;
}

export default function OvertimeReasonModal(props: OvertimeReasonModalProps) {
  const [reason, setReason] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!reason().trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateOvertimeReason(props.trackerId, reason());
      setReason("");
      props.onReasonSubmitted();
      props.onClose();
    } catch (err) {
      setError("Failed to submit reason. Please try again.");
      console.error(err);
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
                <h2 class="text-lg font-semibold text-foreground">Overtime Report</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Required project documentation
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
                <label class="block text-sm font-medium text-foreground">
                  Reason for overtime
                </label>
                <textarea
                  value={reason()}
                  onInput={(e) => setReason(e.currentTarget.value)}
                  placeholder="Briefly explain the cause for overtime..."
                  required
                  rows={4}
                  class="input w-full resize-none"
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
                  disabled={isSubmitting() || !reason().trim()}
                  class="btn btn-primary flex-1"
                >
                  {isSubmitting() ? "Submitting..." : "Submit Reason"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
