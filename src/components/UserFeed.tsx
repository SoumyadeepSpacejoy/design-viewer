"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchUsers, SearchedUser, pseudoLoginAsUser } from "@/app/clientApi";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

const IMPERSONATE_REDIRECT = "https://www.spacejoy.com/admin-impersonate";
const ADMIN_ROLES = ["admin", "owner"];

const LIMIT = 20;

export default function UserFeed() {
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [impersonatingEmail, setImpersonatingEmail] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState("");

  useEffect(() => {
    setAdminRole(localStorage.getItem("user_role"));
  }, []);

  const canImpersonate = !!adminRole && ADMIN_ROLES.includes(adminRole);

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

  const load = useCallback(
    async (isInitial: boolean, opts?: { query?: string; startDate?: string; endDate?: string }) => {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError("");

      const currentSkip = isInitial ? 0 : skip;
      const q = opts?.query ?? query;
      const sd = opts?.startDate ?? startDate;
      const ed = opts?.endDate ?? endDate;

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
    },
    [skip, query, startDate, endDate],
  );

  useEffect(() => {
    load(true, { query: "", startDate: "", endDate: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(true);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, startDate, endDate]);

  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(false);
      },
      { threshold: 0.1, rootMargin: "100px" },
    );
    const target = observerTarget.current;
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, load]);

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

  if (loading) return <PageLoader message="Loading users..." />;

  return (
    <div className="animate-fade-in">
      {impersonateError && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {impersonateError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search users by email or name, filter by signup date
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span> users
          {(startDate || endDate) && " in range"}
        </div>
      </div>

      <div className="card p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="input w-full"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <DateRangePicker startDate={startDate} endDate={endDate} onRangeChange={handleRangeChange} />
        {(query || startDate || endDate) && (
          <button onClick={handleClear} className="btn btn-secondary btn-sm">
            Clear
          </button>
        )}
      </div>

      {error ? (
        <div className="card py-16 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <button onClick={() => load(true)} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Created At</th>
                  {canImpersonate && <th className="text-right font-medium px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">{u.profile?.name || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    {canImpersonate && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleLoginAsUser(u.email)}
                          disabled={impersonatingEmail === u.email}
                          className="btn btn-secondary btn-sm gap-1.5"
                          title={`Log in as ${u.email}`}
                        >
                          {impersonatingEmail === u.email ? (
                            <>
                              <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" x2="3" y1="12" y2="12" />
                              </svg>
                              Log in
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div ref={observerTarget} className="h-10 flex justify-center items-center">
            {loadingMore && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
