"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  addWalletBalance,
  fetchWalletByUser,
  WalletData,
} from "@/app/clientApi";

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { _id: string; email: string; name?: string };
}

export default function AddBalanceModal({
  isOpen,
  onClose,
  user,
}: AddBalanceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Load (or lazily create) the user's wallet whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    setError(null);
    setSuccess(null);
    setAmount("");
    setWallet(null);
    setLoadingWallet(true);

    fetchWalletByUser(user._id)
      .then((w) => {
        if (active) setWallet(w);
      })
      .catch((e) => {
        if (active) setError((e as Error).message || "Failed to load wallet");
      })
      .finally(() => {
        if (active) setLoadingWallet(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user._id]);

  if (!isOpen || !mounted) return null;

  const amountNum = Number(amount);
  const validAmount = Number.isFinite(amountNum) && amountNum > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet?._id) {
      setError("Wallet not loaded yet. Please wait a moment.");
      return;
    }
    if (!validAmount) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await addWalletBalance(user._id, wallet._id, amountNum);
      setSuccess(res?.message || `$${amountNum} credited`);
      // Reflect the new balance locally so the admin sees it update.
      setWallet((prev) =>
        prev ? { ...prev, balance: (prev.balance || 0) + amountNum } : prev,
      );
      setAmount("");
    } catch (err) {
      setError((err as Error).message || "Failed to add balance.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add Wallet Balance
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.name || user.email}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon">
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

        <div className="p-4 bg-muted rounded-md border border-border mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Current wallet balance
          </p>
          {loadingWallet ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              Loading wallet...
            </div>
          ) : (
            <p className="text-primary font-semibold text-lg tabular-nums">
              ${wallet?.balance ?? 0}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Amount to add ($)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 20"
              className="input w-full"
              disabled={loadingWallet || submitting}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              {success ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={
                submitting || loadingWallet || !validAmount || !wallet?._id
              }
              className="btn btn-primary flex-1"
            >
              {submitting ? "Adding..." : "Add Balance"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
