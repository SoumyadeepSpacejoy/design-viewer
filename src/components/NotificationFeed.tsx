"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Notification as SpacejoyNotification } from "@/app/types";
import {
  fetchNotifications,
  deleteNotification,
  pushNotification,
  scheduleNotification,
} from "@/app/actions";
import NotificationRow from "./NotificationRow";
import CreateNotificationModal from "./CreateNotificationModal";
import PushConfirmationModal from "./PushConfirmationModal";
import ScheduleModal from "./ScheduleModal";
import SuccessToast from "./SuccessToast";
import PageLoader from "./PageLoader";

const LIMIT = 10;

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState<SpacejoyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pushModal, setPushModal] = useState<{ isOpen: boolean; notificationId: string; loading: boolean }>({
    isOpen: false, notificationId: "", loading: false,
  });
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; notificationId: string; loading: boolean }>({
    isOpen: false, notificationId: "", loading: false,
  });
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(
    async (isInitial = false) => {
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
        const currentSkip = isInitial ? 0 : skip;
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
    },
    [skip],
  );

  useEffect(() => {
    loadNotifications(true);
  }, []);

  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadNotifications(); },
      { threshold: 0.1, rootMargin: "100px" },
    );
    const currentTarget = observerTarget.current;
    observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadNotifications]);

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

  const handleCreated = () => { loadNotifications(true); };

  const handlePush = (id: string) => {
    setPushModal({ isOpen: true, notificationId: id, loading: false });
  };

  const handleConfirmPush = async (audience: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setPushModal((prev) => ({ ...prev, loading: true }));
    try {
      const audienceValue = audience === "marketing" ? null : audience;
      await pushNotification(token, pushModal.notificationId, audienceValue);
      setToast({ show: true, message: "Notification pushed successfully" });
      setPushModal({ isOpen: false, notificationId: "", loading: false });
    } catch (err) {
      alert("Failed to push notification.");
      setPushModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSchedule = (id: string) => {
    setScheduleModal({ isOpen: true, notificationId: id, loading: false });
  };

  const handleConfirmSchedule = async (date: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setScheduleModal((prev) => ({ ...prev, loading: true }));
    try {
      await scheduleNotification(token, scheduleModal.notificationId, date);
      const formattedDate = new Date(date).toLocaleString();
      setToast({ show: true, message: `Notification scheduled for ${formattedDate}` });
      setScheduleModal({ isOpen: false, notificationId: "", loading: false });
    } catch (err) {
      alert("Failed to schedule notification.");
      setScheduleModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleEdit = (notification: SpacejoyNotification) => {
    alert("Edit functionality coming soon!");
  };

  if (loading) {
    return <PageLoader message="Loading notifications..." />;
  }

  if (error) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="card max-w-md mx-auto p-8">
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-destructive">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <button onClick={() => loadNotifications(true)} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <CreateNotificationModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={handleCreated} />
      <PushConfirmationModal isOpen={pushModal.isOpen} onClose={() => setPushModal({ ...pushModal, isOpen: false })} onConfirm={handleConfirmPush} loading={pushModal.loading} />
      <ScheduleModal isOpen={scheduleModal.isOpen} onClose={() => setScheduleModal({ ...scheduleModal, isOpen: false })} onSchedule={handleConfirmSchedule} loading={scheduleModal.loading} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage push notifications and broadcasts</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-sm gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Notification
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification._id}
                notification={notification}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPush={handlePush}
                onSchedule={handleSchedule}
              />
            ))}
            <div ref={observerTarget} className="h-10 flex justify-center items-center">
              {loadingMore && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading more...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card py-16 text-center">
            <p className="text-sm text-muted-foreground">No notifications found</p>
          </div>
        )}
      </div>

      {toast.show && (
        <SuccessToast message={toast.message} onClose={() => setToast({ show: false, message: "" })} />
      )}
    </div>
  );
}
