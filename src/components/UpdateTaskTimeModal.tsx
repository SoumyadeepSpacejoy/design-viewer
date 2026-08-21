import { Portal } from "solid-js/web";
import { createEffect, createSignal, Show } from "solid-js";

interface UpdateTaskTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentSeconds: number;
  onSubmit: (totalSeconds: number) => Promise<void> | void;
  isSubmitting?: boolean;
}

export default function UpdateTaskTimeModal(props: UpdateTaskTimeModalProps) {
  const [hours, setHours] = createSignal(0);
  const [minutes, setMinutes] = createSignal(0);
  const [seconds, setSeconds] = createSignal(0);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (props.isOpen) {
      setHours(Math.floor(props.currentSeconds / 3600));
      setMinutes(Math.floor((props.currentSeconds % 3600) / 60));
      setSeconds(props.currentSeconds % 60);
      setError(null);
    }
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!props.taskId) {
      setError("Task ID is missing. Please refresh and try again.");
      return;
    }

    const h = hours();
    const m = minutes();
    const s = seconds();
    const safeHours = Number.isFinite(h) && h >= 0 ? h : 0;
    const safeMinutes = Number.isFinite(m) && m >= 0 && m < 60 ? m : 0;
    const safeSeconds = Number.isFinite(s) && s >= 0 && s < 60 ? s : 0;

    const totalSeconds = safeHours * 3600 + safeMinutes * 60 + safeSeconds;

    try {
      setError(null);
      await props.onSubmit(totalSeconds);
    } catch (err) {
      console.error("Error updating task time:", err);
      setError("Failed to update task time. Please try again.");
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
                <h2 class="text-lg font-semibold text-foreground">Update Task Time</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Adjust hours, minutes, and seconds
                </p>
              </div>
              <button
                onClick={() => props.onClose()}
                disabled={props.isSubmitting}
                class="btn btn-ghost btn-sm btn-icon"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="grid grid-cols-3 gap-4">
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
                    onInput={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      setMinutes(Number.isNaN(value) ? 0 : Math.max(0, value));
                    }}
                    class="input w-full"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds()}
                    onInput={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      setSeconds(Number.isNaN(value) ? 0 : Math.max(0, value));
                    }}
                    class="input w-full"
                  />
                </div>
              </div>

              <div class="p-4 bg-muted rounded-md border border-border">
                <p class="text-sm text-muted-foreground mb-1">New total time</p>
                <p class="text-primary font-semibold text-lg tabular-nums">
                  {hours()}h {minutes()}m {seconds()}s
                </p>
              </div>

              <Show when={error()}>
                <p class="text-sm text-destructive">{error()}</p>
              </Show>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => props.onClose()}
                  disabled={props.isSubmitting}
                  class="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={props.isSubmitting} class="btn btn-primary flex-1">
                  {props.isSubmitting ? "Updating..." : "Update Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
