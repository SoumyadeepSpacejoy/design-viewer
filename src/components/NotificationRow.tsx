"use client";

import { useState, useRef, useEffect } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`group relative glass-panel rounded-2xl p-6 border border-pink-500/10 hover:border-pink-500/30 transition-all duration-300 animate-fade-in-scale ${
        isMenuOpen
          ? "z-50 ring-1 ring-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.15)]"
          : "z-auto"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
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
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-pink-500/5 border border-pink-500/10 rounded-lg">
              <span className="text-[9px] font-black text-pink-500/40 uppercase tracking-tighter">
                Type
              </span>
              <span className="text-[10px] font-bold text-pink-300 uppercase tracking-tight">
                {notification.type}
              </span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-pink-500/5 border border-pink-500/10 rounded-lg">
              <span className="text-[9px] font-black text-pink-500/40 uppercase tracking-tighter">
                Route
              </span>
              <span className="text-[10px] font-bold text-pink-300 tracking-tight lowercase">
                {notification.route}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-500 shadow-xl ${
              isMenuOpen
                ? "bg-pink-500/30 border-pink-400 text-white scale-110 rotate-90"
                : "bg-pink-500/5 border-pink-500/10 text-pink-400/60 hover:bg-pink-500/20 hover:border-pink-500/40 hover:text-pink-400 hover:scale-110"
            }`}
            title="More Actions"
          >
            <svg
              className="w-5 h-5 drop-shadow-sm"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="5" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="12" cy="19" r="2.2" />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              {/* Pointer Nub */}
              <div className="absolute right-4 top-[calc(100%+4px)] w-3 h-3 bg-black border-l border-t border-pink-500/30 rotate-45 z-[101] animate-in fade-in slide-in-from-top-2 duration-300" />

              <div className="absolute right-0 mt-4 w-56 bg-black/95 backdrop-blur-3xl border border-pink-500/30 rounded-[1.8rem] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(236,72,153,0.1)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-500 ring-1 ring-white/10">
                <div className="py-2">
                  <div className="px-5 py-2 mb-1 border-b border-pink-500/10 text-[9px] font-black text-pink-500/30 uppercase tracking-[0.4em]">
                    Operations
                  </div>

                  <div className="px-2 space-y-1">
                    <button
                      onClick={() => {
                        onPush(notification._id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-pink-100 hover:bg-pink-500/10 hover:text-pink-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all group/item"
                    >
                      <div className="p-2.5 bg-pink-500/5 rounded-xl group-hover/item:bg-pink-500/20 border border-pink-500/10 transition-colors">
                        <svg
                          className="w-3.5 h-3.5"
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
                      </div>
                      Execute Push
                    </button>

                    <button
                      onClick={() => {
                        onEdit(notification);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-pink-100 hover:bg-pink-500/10 hover:text-pink-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all group/item"
                    >
                      <div className="p-2.5 bg-pink-500/5 rounded-xl group-hover/item:bg-pink-500/20 border border-pink-500/10 transition-colors">
                        <svg
                          className="w-3.5 h-3.5"
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
                      </div>
                      Update Details
                    </button>

                    <div className="h-px bg-pink-500/10 my-2 mx-4" />

                    <button
                      onClick={() => {
                        onDelete(notification._id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-red-100 hover:bg-red-500/20 hover:text-red-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all group/item"
                    >
                      <div className="p-2.5 bg-red-500/5 rounded-xl group-hover/item:bg-red-500/20 border border-red-500/10 transition-colors">
                        <svg
                          className="w-3.5 h-3.5"
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
                      </div>
                      Purge Entry
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
