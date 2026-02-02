"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Notification as SpacejoyNotification } from "@/app/types";
import {
  fetchNotifications,
  deleteNotification,
  pushNotification,
} from "@/app/actions";
import NotificationRow from "./NotificationRow";
import CreateNotificationModal from "./CreateNotificationModal";
import PushConfirmationModal from "./PushConfirmationModal";
import SuccessToast from "./SuccessToast";

const LIMIT = 10;

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState<SpacejoyNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pushModal, setPushModal] = useState<{
    isOpen: boolean;
    notificationId: string;
    loading: boolean;
  }>({
    isOpen: false,
    notificationId: "",
    loading: false,
  });
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

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
          if (data.length < LIMIT) {
            setHasMore(false);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNotifications();
        }
      },
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

  const handleCreated = (notification?: SpacejoyNotification) => {
    // Re-fetch everything as requested by user
    loadNotifications(true);
  };

  const handlePush = (id: string) => {
    setPushModal({
      isOpen: true,
      notificationId: id,
      loading: false,
    });
  };

  const handleConfirmPush = async (audience: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setPushModal((prev) => ({ ...prev, loading: true }));

    try {
      // Map audience: "marketing" -> null, others -> as is ("non-purchase-ai-Design")
      const audienceValue = audience === "marketing" ? null : audience;
      await pushNotification(token, pushModal.notificationId, audienceValue);
      setToast({ show: true, message: "Notification pushed successfully" });
      setPushModal({ isOpen: false, notificationId: "", loading: false });
    } catch (err) {
      alert("Failed to push notification.");
      setPushModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleEdit = (notification: SpacejoyNotification) => {
    alert("Edit functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-pink-400/40 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
          Syncing Neural Link...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="max-w-md mx-auto glass-panel p-12 rounded-[3rem] border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-red-400 text-sm mb-8 font-medium">{error}</p>
          <button
            onClick={() => loadNotifications(true)}
            className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      <PushConfirmationModal
        isOpen={pushModal.isOpen}
        onClose={() => setPushModal({ ...pushModal, isOpen: false })}
        onConfirm={handleConfirmPush}
        loading={pushModal.loading}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-4 sm:px-6">
        <div>
          <h2 className="text-xl sm:text-3xl font-light text-pink-100 tracking-tight text-pink-shadow uppercase">
            Spacejoy{" "}
            <span className="text-pink-400 font-medium">Notifications</span>
          </h2>
          <p className="text-pink-300/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Managing global notifications
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 sm:py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-xs font-bold uppercase tracking-widest transition-all group"
        >
          <svg
            className="w-4 h-4 transform group-hover:rotate-90 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Notification
        </button>
      </div>

      <div className="grid gap-4 px-2 sm:px-6">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification._id}
                notification={notification}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPush={handlePush}
              />
            ))}

            {/* Observer Target */}
            <div
              ref={observerTarget}
              className="h-20 flex justify-center items-center"
            >
              {loadingMore && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                  <span className="text-[10px] text-pink-400/40 font-bold uppercase tracking-widest">
                    Compiling Data...
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 text-center glass-panel rounded-[3rem] border border-pink-500/5">
            <p className="text-pink-300/20 text-sm font-light uppercase tracking-[0.2em]">
              No active transmissions found in the matrix.
            </p>
          </div>
        )}
      </div>
      {toast.show && (
        <SuccessToast
          message={toast.message}
          onClose={() => setToast({ show: false, message: "" })}
        />
      )}
    </div>
  );
}
