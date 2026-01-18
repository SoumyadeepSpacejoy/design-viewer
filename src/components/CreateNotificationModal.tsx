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
      setError("Transmission failed. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="w-full max-w-xl glass-panel rounded-[1.8rem] sm:rounded-[3rem] border border-pink-500/20 shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[60px] rounded-full -z-10"></div>

          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-light text-pink-100 tracking-tight text-pink-shadow uppercase">
                Initiate{" "}
                <span className="text-pink-400 font-medium">Broadcast</span>
              </h2>
              <p className="text-pink-300/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                Configure transmission parameters
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-pink-500/5 hover:bg-pink-500/20 rounded-2xl text-pink-400/60 transition-all border border-pink-500/0 hover:border-pink-500/20"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pl-1">
                  Topic
                </label>
                <input
                  required
                  type="text"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  className="w-full bg-black/40 border border-pink-500/10 rounded-xl px-5 py-4 text-pink-100 text-sm focus:outline-none focus:border-pink-500/40 transition-all placeholder:text-pink-900/40"
                  placeholder="Enter topic..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pl-1">
                  Type
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-black/40 border border-pink-500/10 rounded-xl px-5 py-4 text-pink-100 text-sm focus:outline-none focus:border-pink-500/40 transition-all appearance-none cursor-pointer"
                >
                  <option
                    value=""
                    disabled
                    className="bg-black text-pink-900/40"
                  >
                    Select type...
                  </option>
                  <option
                    value="appAnnouncement"
                    className="bg-black text-pink-100"
                  >
                    appAnnouncement
                  </option>
                  <option
                    value="marketingUpdates"
                    className="bg-black text-pink-100"
                  >
                    marketingUpdates
                  </option>
                  <option
                    value="projectUpdates"
                    className="bg-black text-pink-100"
                  >
                    projectUpdates
                  </option>
                  <option
                    value="chatMessageUpdate"
                    className="bg-black text-pink-100"
                  >
                    chatMessageUpdate
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pl-1">
                Title
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-black/40 border border-pink-500/10 rounded-xl px-5 py-4 text-pink-100 text-sm focus:outline-none focus:border-pink-500/40 transition-all placeholder:text-pink-900/40"
                placeholder="Enter compelling title..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pl-1">
                Body
              </label>
              <textarea
                required
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                className="w-full bg-black/40 border border-pink-500/10 rounded-xl px-5 py-4 text-pink-100 text-sm focus:outline-none focus:border-pink-500/40 transition-all placeholder:text-pink-900/40 min-h-[100px] resize-none"
                placeholder="Enter detailed message..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pl-1">
                Redirect Route
              </label>
              <input
                required
                type="text"
                value={formData.route}
                onChange={(e) =>
                  setFormData({ ...formData, route: e.target.value })
                }
                className="w-full bg-black/40 border border-pink-500/10 rounded-xl px-5 py-4 text-pink-100 text-sm focus:outline-none focus:border-pink-500/40 transition-all placeholder:text-pink-900/40"
                placeholder="Enter redirect path (e.g. /shop)..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium text-center animate-shake">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Verifying Link...
                </>
              ) : (
                <>
                  Transmit Message
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
