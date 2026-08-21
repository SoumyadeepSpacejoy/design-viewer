import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import {
  deleteNotification,
  fetchNotifications,
  pushNotification,
  scheduleNotification,
} from "~/lib/designApi";
import type { Notification as SpacejoyNotification } from "~/lib/types";
import CreateNotificationModal from "./CreateNotificationModal";
import NotificationRow from "./NotificationRow";
import PageLoader from "./PageLoader";
import PushConfirmationModal from "./PushConfirmationModal";
import ScheduleModal from "./ScheduleModal";
import SuccessToast from "./SuccessToast";

const LIMIT = 10;

export default function NotificationFeed() {
  const [notifications, setNotifications] = createSignal<SpacejoyNotification[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal("");
  const [hasMore, setHasMore] = createSignal(true);
  const [skip, setSkip] = createSignal(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);
  const [pushModal, setPushModal] = createStore({
    isOpen: false,
    notificationId: "",
    loading: false,
  });
  const [scheduleModal, setScheduleModal] = createStore({
    isOpen: false,
    notificationId: "",
    loading: false,
  });
  const [toast, setToast] = createStore({ show: false, message: "" });
  const [observerTarget, setObserverTarget] = createSignal<HTMLDivElement>();

  const loadNotifications = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authorization token missing.");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      const currentSkip = isInitial ? 0 : skip();
      const data = await fetchNotifications(token, LIMIT, currentSkip);
      if (isInitial) {
        setNotifications(data);
        setSkip(LIMIT);
        setHasMore(data.length === LIMIT);
      } else {
        setNotifications((prev) => [...prev, ...data]);
        setSkip((prev) => prev + LIMIT);
        if (data.length < LIMIT) setHasMore(false);
      }
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  onMount(() => {
    loadNotifications(true);
  });

  createEffect(() => {
    const target = observerTarget();
    if (!target || !hasMore() || loadingMore() || loading()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNotifications();
      },
      { threshold: 0.1, rootMargin: "100px" },
    );
    observer.observe(target);
    onCleanup(() => observer.disconnect());
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      alert("Failed to delete notification.");
    }
  };

  const handleCreated = () => {
    loadNotifications(true);
  };

  const handlePush = (id: string) => {
    setPushModal({ isOpen: true, notificationId: id, loading: false });
  };

  const handleConfirmPush = async (audience: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setPushModal("loading", true);
    try {
      const audienceValue = audience === "marketing" ? null : audience;
      await pushNotification(token, pushModal.notificationId, audienceValue);
      setToast({ show: true, message: "Notification pushed successfully" });
      setPushModal({ isOpen: false, notificationId: "", loading: false });
    } catch (err) {
      alert("Failed to push notification.");
      setPushModal("loading", false);
    }
  };

  const handleSchedule = (id: string) => {
    setScheduleModal({ isOpen: true, notificationId: id, loading: false });
  };

  const handleConfirmSchedule = async (date: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setScheduleModal("loading", true);
    try {
      await scheduleNotification(token, scheduleModal.notificationId, date);
      const formattedDate = new Date(date).toLocaleString();
      setToast({ show: true, message: `Notification scheduled for ${formattedDate}` });
      setScheduleModal({ isOpen: false, notificationId: "", loading: false });
    } catch (err) {
      alert("Failed to schedule notification.");
      setScheduleModal("loading", false);
    }
  };

  const handleEdit = (_notification: SpacejoyNotification) => {
    alert("Edit functionality coming soon!");
  };

  return (
    <Show when={!loading()} fallback={<PageLoader message="Loading notifications..." />}>
      <Show
        when={!error()}
        fallback={
          <div class="py-20 text-center animate-fade-in">
            <div class="card max-w-md mx-auto p-8">
              <div class="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-destructive">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-sm text-destructive mb-4">{error()}</p>
              <button onClick={() => loadNotifications(true)} class="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          </div>
        }
      >
        <div class="animate-fade-in">
          <CreateNotificationModal
            isOpen={isCreateModalOpen()}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={handleCreated}
          />
          <PushConfirmationModal
            isOpen={pushModal.isOpen}
            onClose={() => setPushModal("isOpen", false)}
            onConfirm={handleConfirmPush}
            loading={pushModal.loading}
          />
          <ScheduleModal
            isOpen={scheduleModal.isOpen}
            onClose={() => setScheduleModal("isOpen", false)}
            onSchedule={handleConfirmSchedule}
            loading={scheduleModal.loading}
          />

          {/* Header */}
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 class="text-2xl font-semibold text-foreground tracking-tight">
                Notifications
              </h1>
              <p class="text-sm text-muted-foreground mt-1">
                Manage push notifications and broadcasts
              </p>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} class="btn btn-primary btn-sm gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
              </svg>
              New Notification
            </button>
          </div>

          {/* List */}
          <div class="space-y-3">
            <Show
              when={notifications().length > 0}
              fallback={
                <div class="card py-16 text-center">
                  <p class="text-sm text-muted-foreground">No notifications found</p>
                </div>
              }
            >
              <For each={notifications()}>
                {(notification) => (
                  <NotificationRow
                    notification={notification}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPush={handlePush}
                    onSchedule={handleSchedule}
                  />
                )}
              </For>
              <div ref={setObserverTarget} class="h-10 flex justify-center items-center">
                <Show when={loadingMore()}>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span class="text-xs text-muted-foreground">Loading more...</span>
                  </div>
                </Show>
              </div>
            </Show>
          </div>

          <Show when={toast.show}>
            <SuccessToast
              message={toast.message}
              onClose={() => setToast({ show: false, message: "" })}
            />
          </Show>
        </div>
      </Show>
    </Show>
  );
}
