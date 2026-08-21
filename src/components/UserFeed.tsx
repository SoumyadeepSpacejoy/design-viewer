import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { pseudoLoginAsUser, searchUsers, type SearchedUser } from "~/lib/clientApi";
import AddBalanceModal from "./AddBalanceModal";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

const IMPERSONATE_REDIRECT = "https://www.spacejoy.com/admin-impersonate";
const ADMIN_ROLES = ["admin", "owner"];

const LIMIT = 20;

export default function UserFeed() {
  const [users, setUsers] = createSignal<SearchedUser[]>([]);
  const [total, setTotal] = createSignal(0);
  const [query, setQuery] = createSignal("");
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal("");
  const [skip, setSkip] = createSignal(0);
  const [hasMore, setHasMore] = createSignal(true);

  const [observerTarget, setObserverTarget] = createSignal<HTMLDivElement>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const [adminRole, setAdminRole] = createSignal<string | null>(null);
  const [impersonatingEmail, setImpersonatingEmail] = createSignal<string | null>(null);
  const [impersonateError, setImpersonateError] = createSignal("");
  const [balanceUser, setBalanceUser] = createSignal<SearchedUser | null>(null);

  onMount(() => {
    setAdminRole(localStorage.getItem("user_role"));
  });

  const canImpersonate = () => !!adminRole() && ADMIN_ROLES.includes(adminRole()!);

  const handleLoginAsUser = async (customerEmail: string) => {
    setImpersonateError("");
    setImpersonatingEmail(customerEmail);
    try {
      const { token } = await pseudoLoginAsUser(customerEmail);
      window.open(
        `${IMPERSONATE_REDIRECT}?token=${encodeURIComponent(token)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err) {
      setImpersonateError((err as Error)?.message || "Failed to log in as user");
    } finally {
      setImpersonatingEmail(null);
    }
  };

  const load = async (
    isInitial: boolean,
    opts?: { query?: string; startDate?: string; endDate?: string },
  ) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError("");

    const currentSkip = isInitial ? 0 : skip();
    const q = opts?.query ?? query();
    const sd = opts?.startDate ?? startDate();
    const ed = opts?.endDate ?? endDate();

    try {
      const data = await searchUsers({
        query: q || undefined,
        startDate: sd || undefined,
        endDate: ed || undefined,
        limit: LIMIT,
        skip: currentSkip,
      });

      if (isInitial) {
        setUsers(data.users);
        setTotal(data.total);
        setSkip(LIMIT);
        setHasMore(data.users.length === LIMIT);
      } else {
        setUsers((prev) => [...prev, ...data.users]);
        setSkip((prev) => prev + LIMIT);
        if (data.users.length < LIMIT) setHasMore(false);
      }
    } catch (e) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  onMount(() => {
    load(true, { query: "", startDate: "", endDate: "" });
  });

  // Debounced refetch when the filters change (skips the first run —
  // the mount above already did the initial load).
  createEffect(
    on(
      () => [query(), startDate(), endDate()],
      () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => load(true), 350);
        onCleanup(() => {
          if (debounceTimer) clearTimeout(debounceTimer);
        });
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const target = observerTarget();
    if (!target || !hasMore() || loadingMore() || loading()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(false);
      },
      { threshold: 0.1, rootMargin: "100px" },
    );
    observer.observe(target);
    onCleanup(() => observer.disconnect());
  });

  const handleRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleClear = () => {
    setQuery("");
    setStartDate("");
    setEndDate("");
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <Show when={!loading()} fallback={<PageLoader message="Loading users..." />}>
      <div class="animate-fade-in">
        <Show when={impersonateError()}>
          <div class="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {impersonateError()}
          </div>
        </Show>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-foreground tracking-tight">Users</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Search users by email or name, filter by signup date
            </p>
          </div>
          <div class="text-sm text-muted-foreground">
            <span class="font-semibold text-foreground">{total().toLocaleString()}</span>{" "}
            users
            {(startDate() || endDate()) && " in range"}
          </div>
        </div>

        <div class="card p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div class="relative flex-1">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
            </svg>
            <input
              type="text"
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search by email or name..."
              class="input w-full"
              style={{ "padding-left": "2.25rem" }}
            />
          </div>
          <DateRangePicker
            startDate={startDate()}
            endDate={endDate()}
            onRangeChange={handleRangeChange}
          />
          <Show when={query() || startDate() || endDate()}>
            <button onClick={handleClear} class="btn btn-secondary btn-sm">
              Clear
            </button>
          </Show>
        </div>

        <Show
          when={!error()}
          fallback={
            <div class="card py-16 text-center">
              <p class="text-sm text-destructive mb-4">{error()}</p>
              <button onClick={() => load(true)} class="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          }
        >
          <Show
            when={users().length > 0}
            fallback={
              <div class="card py-16 text-center">
                <p class="text-sm text-muted-foreground">No users found</p>
              </div>
            }
          >
            <div class="card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-secondary/40 text-muted-foreground">
                    <tr>
                      <th class="text-left font-medium px-4 py-3">Name</th>
                      <th class="text-left font-medium px-4 py-3">Email</th>
                      <th class="text-left font-medium px-4 py-3">Created At</th>
                      <Show when={canImpersonate()}>
                        <th class="text-right font-medium px-4 py-3">Actions</th>
                      </Show>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={users()}>
                      {(u) => (
                        <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
                          <td class="px-4 py-3 text-foreground">{u.profile?.name || "—"}</td>
                          <td class="px-4 py-3 text-foreground">{u.email}</td>
                          <td class="px-4 py-3 text-muted-foreground">
                            {formatDate(u.createdAt)}
                          </td>
                          <Show when={canImpersonate()}>
                            <td class="px-4 py-3">
                              <div class="flex justify-end gap-2">
                                <button
                                  onClick={() => setBalanceUser(u)}
                                  class="btn btn-sm gap-1.5 border border-amber-600 text-amber-600 hover:bg-amber-600/10"
                                  title={`Add wallet balance for ${u.email}`}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <path d="M16 12h.01" />
                                    <path d="M2 10h20" />
                                  </svg>
                                  Add balance
                                </button>
                                <button
                                  onClick={() => handleLoginAsUser(u.email)}
                                  disabled={impersonatingEmail() === u.email}
                                  class="btn btn-sm gap-1.5 border border-green-600 text-green-600 hover:bg-green-600/10 disabled:opacity-60"
                                  title={`Log in as ${u.email}`}
                                >
                                  <Show
                                    when={impersonatingEmail() === u.email}
                                    fallback={
                                      <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                          <polyline points="10 17 15 12 10 7" />
                                          <line x1="15" x2="3" y1="12" y2="12" />
                                        </svg>
                                        Log in
                                      </>
                                    }
                                  >
                                    <div class="w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                                    Logging in...
                                  </Show>
                                </button>
                              </div>
                            </td>
                          </Show>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <div ref={setObserverTarget} class="h-10 flex justify-center items-center">
                <Show when={loadingMore()}>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span class="text-xs text-muted-foreground">Loading more...</span>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </Show>

        <Show when={balanceUser()}>
          {(u) => (
            <AddBalanceModal
              isOpen={true}
              onClose={() => setBalanceUser(null)}
              user={{
                _id: u()._id,
                email: u().email,
                name: u().profile?.name,
              }}
            />
          )}
        </Show>
      </div>
    </Show>
  );
}
