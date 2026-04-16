"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createNotification } from "@/app/actions";
import { Notification } from "@/app/types";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (notification: Notification) => void;
}

export default function CreateNotificationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    title: "",
    body: "",
    type: "",
    route: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      await createNotification(token, formData);

      onCreated({} as Notification); // The parent will refetch, so passing empty for now
      onClose();
      // Reset form
      setFormData({
        topic: "",
        title: "",
        body: "",
        type: "",
        route: "",
      });
    } catch (err) {
      setError("Failed to create notification. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-xl mx-4 shadow-xl animate-fade-in-scale relative z-10 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Create Notification
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure notification parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-icon"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Topic
              </label>
              <input
                required
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="input w-full"
                placeholder="Enter topic..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Type
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input w-full"
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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input w-full"
              placeholder="Enter title..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Body
            </label>
            <textarea
              required
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              className="input w-full min-h-25 resize-none"
              placeholder="Enter message body..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Redirect Route
            </label>
            <input
              required
              type="text"
              value={formData.route}
              onChange={(e) =>
                setFormData({ ...formData, route: e.target.value })
              }
              className="input w-full"
              placeholder="Enter redirect path (e.g. /shop)..."
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary flex-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Create Notification"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
