import { Portal } from "solid-js/web";
import { createSignal, Show } from "solid-js";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string) => void;
  loading?: boolean;
}

export default function ScheduleModal(props: ScheduleModalProps) {
  const [dateTime, setDateTime] = createSignal("");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (dateTime()) {
      props.onSchedule(new Date(dateTime()).toISOString());
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal mount={document.body}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="absolute inset-0" onClick={() => props.onClose()} />

          <div
            class="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Schedule Later</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Select date and time for delivery
                </p>
              </div>
              <button onClick={() => props.onClose()} class="btn btn-ghost btn-sm btn-icon">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">
                  Schedule Date & Time
                </label>
                <input
                  required
                  type="datetime-local"
                  value={dateTime()}
                  onInput={(e) => setDateTime(e.currentTarget.value)}
                  class="input w-full"
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button type="button" onClick={() => props.onClose()} class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  disabled={props.loading || !dateTime()}
                  type="submit"
                  class="btn btn-primary flex-2 flex items-center justify-center gap-2"
                >
                  <Show when={props.loading} fallback="Schedule">
                    <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </Show>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
