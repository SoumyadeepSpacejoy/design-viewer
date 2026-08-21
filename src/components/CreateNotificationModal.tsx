import { Portal } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { createNotification } from "~/lib/designApi";
import type { Notification } from "~/lib/types";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (notification: Notification) => void;
}

const EMPTY_FORM = { topic: "", title: "", body: "", type: "", route: "" };

export default function CreateNotificationModal(props: CreateNotificationModalProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [formData, setFormData] = createStore({ ...EMPTY_FORM });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Auth session expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      await createNotification(token, { ...formData });

      props.onCreated({} as Notification); // The parent will refetch, so passing empty for now
      props.onClose();
      // Reset form
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      setError("Failed to create notification. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal mount={document.body}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="absolute inset-0" onClick={() => props.onClose()} />

          <div
            class="card p-6 w-full max-w-xl mx-4 shadow-xl animate-fade-in-scale relative z-10 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Create Notification</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Configure notification parameters
                </p>
              </div>
              <button onClick={() => props.onClose()} class="btn btn-ghost btn-sm btn-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">Topic</label>
                  <input
                    required
                    type="text"
                    value={formData.topic}
                    onInput={(e) => setFormData("topic", e.currentTarget.value)}
                    class="input w-full"
                    placeholder="Enter topic..."
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-foreground">Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData("type", e.currentTarget.value)}
                    class="input w-full"
                  >
                    <option value="" disabled>
                      Select type...
                    </option>
                    <option value="appAnnouncement">appAnnouncement</option>
                    <option value="marketingUpdates">marketingUpdates</option>
                    <option value="projectUpdates">projectUpdates</option>
                    <option value="chatMessageUpdate">chatMessageUpdate</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onInput={(e) => setFormData("title", e.currentTarget.value)}
                  class="input w-full"
                  placeholder="Enter title..."
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">Body</label>
                <textarea
                  required
                  value={formData.body}
                  onInput={(e) => setFormData("body", e.currentTarget.value)}
                  class="input w-full min-h-25 resize-none"
                  placeholder="Enter message body..."
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">Redirect Route</label>
                <input
                  required
                  type="text"
                  value={formData.route}
                  onInput={(e) => setFormData("route", e.currentTarget.value)}
                  class="input w-full"
                  placeholder="Enter redirect path (e.g. /shop)..."
                />
              </div>

              <Show when={error()}>
                <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error()}
                </div>
              </Show>

              <div class="flex gap-3 pt-2">
                <button type="button" onClick={() => props.onClose()} class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  disabled={loading()}
                  type="submit"
                  class="btn btn-primary flex-2 flex items-center justify-center gap-2"
                >
                  <Show when={loading()} fallback="Create Notification">
                    <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating...
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
