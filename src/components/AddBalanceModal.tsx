import { Portal } from "solid-js/web";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import {
  addWalletBalance,
  fetchWalletByUser,
  type WalletData,
} from "~/lib/clientApi";

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { _id: string; email: string; name?: string };
}

export default function AddBalanceModal(props: AddBalanceModalProps) {
  const [wallet, setWallet] = createSignal<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = createSignal(false);
  const [amount, setAmount] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  // Load (or lazily create) the user's wallet whenever the modal opens.
  createEffect(() => {
    if (!props.isOpen) return;
    const userId = props.user._id;
    let active = true;

    setError(null);
    setSuccess(null);
    setAmount("");
    setWallet(null);
    setLoadingWallet(true);

    fetchWalletByUser(userId)
      .then((w) => {
        if (active) setWallet(w);
      })
      .catch((e) => {
        if (active) setError((e as Error).message || "Failed to load wallet");
      })
      .finally(() => {
        if (active) setLoadingWallet(false);
      });

    onCleanup(() => {
      active = false;
    });
  });

  const amountNum = () => Number(amount());
  const validAmount = () => Number.isFinite(amountNum()) && amountNum() > 0;

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const w = wallet();
    if (!w?._id) {
      setError("Wallet not loaded yet. Please wait a moment.");
      return;
    }
    if (!validAmount()) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    const value = amountNum();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await addWalletBalance(props.user._id, w._id, value);
      setSuccess(res?.message || `$${value} credited`);
      // Reflect the new balance locally so the admin sees it update.
      setWallet((prev) =>
        prev ? { ...prev, balance: (prev.balance || 0) + value } : prev,
      );
      setAmount("");
    } catch (err) {
      setError((err as Error).message || "Failed to add balance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal mount={document.body}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="fixed inset-0" onClick={() => props.onClose()} />

          <div
            class="card p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in-scale relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Add Wallet Balance</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                  {props.user.name || props.user.email}
                </p>
              </div>
              <button onClick={() => props.onClose()} class="btn btn-ghost btn-sm btn-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-4 bg-muted rounded-md border border-border mb-4">
              <p class="text-sm text-muted-foreground mb-1">Current wallet balance</p>
              <Show
                when={loadingWallet()}
                fallback={
                  <p class="text-primary font-semibold text-lg tabular-nums">
                    ${wallet()?.balance ?? 0}
                  </p>
                }
              >
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  Loading wallet...
                </div>
              </Show>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-foreground">
                  Amount to add ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount()}
                  onInput={(e) => setAmount(e.currentTarget.value)}
                  placeholder="e.g. 20"
                  class="input w-full"
                  disabled={loadingWallet() || submitting()}
                  autofocus
                />
              </div>

              <Show when={error()}>
                <p class="text-sm text-destructive">{error()}</p>
              </Show>
              <Show when={success()}>
                <p class="text-sm text-green-600">{success()}</p>
              </Show>

              <div class="flex gap-3 pt-2">
                <button type="button" onClick={() => props.onClose()} class="btn btn-secondary flex-1">
                  {success() ? "Close" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting() || loadingWallet() || !validAmount() || !wallet()?._id
                  }
                  class="btn btn-primary flex-1"
                >
                  {submitting() ? "Adding..." : "Add Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
