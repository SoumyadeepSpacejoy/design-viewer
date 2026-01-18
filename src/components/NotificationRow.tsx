"use client";

import { Notification } from "@/app/types";

interface NotificationRowProps {
  notification: Notification;
  onEdit: (notification: Notification) => void;
  onDelete: (id: string) => void;
  onPush: (id: string) => void;
}

export default function NotificationRow({
  notification,
  onEdit,
  onDelete,
  onPush,
}: NotificationRowProps) {
  return (
    <div className="group glass-panel rounded-2xl p-6 border border-pink-500/10 hover:border-pink-500/30 transition-all duration-300 animate-fade-in-scale">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded text-[10px] font-bold text-pink-400 uppercase tracking-wider">
              {notification.topic}
            </span>
            <span className="text-[10px] text-pink-500/40 font-medium">
              {new Date(notification.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h4 className="text-lg font-medium text-pink-100 mb-1 truncate">
            {notification.title}
          </h4>
          <p className="text-sm text-pink-300/60 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
          <div className="mt-4 flex items-center gap-4 text-[10px] text-pink-500/30 font-semibold tracking-widest uppercase">
            <span>Type: {notification.type}</span>
            <span>Route: {notification.route}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPush(notification._id)}
            className="p-3 bg-pink-500/10 hover:bg-pink-500/30 rounded-xl text-pink-400 hover:text-white transition-all border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            title="Push Notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.05 9.05 0 0112.728 0m.757-7.11a13.066 13.066 0 011.606 1.625M4.929 4.929a13.024 13.024 0 00-1.625 1.625"
              />
            </svg>
          </button>
          <button
            onClick={() => onEdit(notification)}
            className="p-3 bg-pink-500/5 hover:bg-pink-500/20 rounded-xl text-pink-400/60 hover:text-pink-400 transition-all border border-pink-500/0 hover:border-pink-500/20"
            title="Edit Notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(notification._id)}
            className="p-3 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-400/60 hover:text-red-400 transition-all border border-red-500/0 hover:border-red-500/20"
            title="Delete Notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
