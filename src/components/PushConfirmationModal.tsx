"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PushConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (audience: string) => void;
  loading?: boolean;
}

export default function PushConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: PushConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [audience, setAudience] = useState("marketing");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(audience);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="w-full max-w-md glass-panel rounded-[2rem] border border-border shadow-2xl animate-fade-in-scale relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 sm:p-10 relative">
          {/* Decorative background glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/10 blur-[60px] rounded-full -z-10"></div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">
                Confirm <span className="text-pink-400 font-medium">Push</span>
              </h2>
              <p className="text-muted-foreground/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">
                Select target audience segment
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-primary/5 hover:bg-primary/10 rounded-xl text-primary/60 transition-all border border-border"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest pl-1">
                Audience Segment
              </label>
              <div className="relative group">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-2xl px-5 py-4 text-foreground text-sm focus:outline-none focus:border-primary/40 transition-all appearance-none cursor-pointer group-hover:border-primary/20"
                >
                  <option value="marketing" className="bg-card text-foreground">
                    Marketing
                  </option>
                  <option
                    value="non-purchase-ai-Design"
                    className="bg-card text-foreground"
                  >
                    Non Paying AI Design Customer
                  </option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40 group-hover:text-primary transition-colors">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-primary/5 hover:bg-primary/10 text-primary/60 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border border-border"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="flex-[2] py-4 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl font-bold text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm Push
                    <svg
                      className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"
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
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
