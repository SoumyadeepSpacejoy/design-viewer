import { Portal } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import { updateManualTime } from "~/lib/clientApi";

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentSeconds: number;
  onTimeUpdated: () => void;
}

export default function ManualTimeModal(props: ManualTimeModalProps) {
  const [hours, setHours] = createSignal(Math.floor(props.currentSeconds / 3600));
  const [minutes, setMinutes] = createSignal(
    Math.floor((props.currentSeconds % 3600) / 60),
  );
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const totalSeconds = hours() * 3600 + minutes() * 60;

    if (!props.projectId) {
      setError("Project ID is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateManualTime(props.projectId, totalSeconds);
      props.onTimeUpdated();
      props.onClose();
    } catch (err) {
      setError("Failed to update time. Please try again.");
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
                <h2 class="text-lg font-semibold text-foreground">Update Time Spent</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Manual time adjustment</p>
              </div>
              <button onClick={() => props.onClose()} class="btn btn-ghost btn-sm btn-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={hours()}
                    onInput={(e) => setHours(parseInt(e.currentTarget.value) || 0)}
                    class="input w-full"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes()}
                    onInput={(e) => setMinutes(parseInt(e.currentTarget.value) || 0)}
                    class="input w-full"
                  />
                </div>
              </div>

              <div class="p-4 bg-muted rounded-md border border-border">
                <p class="text-sm text-muted-foreground mb-1">New total time</p>
                <p class="text-primary font-semibold text-lg tabular-nums">
                  {hours()}h {minutes()}m
                </p>
              </div>

              <Show when={error()}>
                <p class="text-sm text-destructive">{error()}</p>
              </Show>

              <div class="flex gap-3 pt-2">
                <button type="button" onClick={() => props.onClose()} class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting()} class="btn btn-primary flex-1">
                  {isSubmitting() ? "Updating..." : "Update Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
