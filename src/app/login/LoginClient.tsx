"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InteractiveBackground from "@/components/InteractiveBackground";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.spacejoy.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.data?.token) {
        const userRole = data.data.user?.role;

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user_role", userRole || "unknown");
        if (data.data.user?.name) {
          localStorage.setItem("user_name", data.data.user.name);
        }
        router.push("/?success=true");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative transition-colors duration-700">
      <InteractiveBackground />

      {/* Top Bar for Theme Toggle */}
      <div className="absolute top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md glass-panel rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-border shadow-2xl overflow-hidden animate-fade-in-scale">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full -z-10"></div>

        {/* Logo/Icon */}
        <div className="flex justify-center mb-6 sm:mb-10">
          <div className="relative p-4 sm:p-5 bg-card/40 rounded-[1.5rem] sm:rounded-3xl border border-border shadow-inner group">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-primary transition-transform duration-500 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
          </div>
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            Spacejoy <span className="text-primary">Portal</span>
          </h1>
          <p className="text-muted-foreground/60 font-bold text-[10px] sm:text-sm tracking-widest uppercase">
            Admin secure authentication
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300 text-foreground placeholder-muted-foreground/30"
              placeholder="explorer@spacejoy.ai"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300 text-foreground placeholder-muted-foreground/30"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl animate-in fade-in slide-in-from-top-2 backdrop-blur-sm flex items-center gap-3">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-primary/20 hover:shadow-primary/40 transform transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Syncing Data...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Inititalize Login
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 opacity-10 dark:opacity-20">
            <div className="w-12 h-px bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <div className="w-12 h-px bg-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
