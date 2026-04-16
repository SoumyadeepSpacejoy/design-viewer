"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.spacejoy.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        router.push("/");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty("--toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--toggle-y", `${y}px`);
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left: Abstract animated panel ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-[#0a0a0a] items-center justify-center">

        {/* Mesh gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 login-mesh-rotate" style={{
            background: "conic-gradient(from 0deg at 50% 50%, #0a0a0a 0deg, #1a1a2e 60deg, #0a0a0a 120deg, #16213e 180deg, #0a0a0a 240deg, #1a1a2e 300deg, #0a0a0a 360deg)",
          }} />
          <div className="absolute inset-0 login-mesh-counter" style={{
            background: "conic-gradient(from 180deg at 40% 60%, transparent 0deg, rgba(99,102,241,0.08) 90deg, transparent 180deg, rgba(139,92,246,0.06) 270deg, transparent 360deg)",
          }} />
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }} />

        {/* Horizontal light streaks */}
        <div className="absolute top-[25%] left-0 w-full h-px login-streak-1">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>
        <div className="absolute top-[55%] right-0 w-full h-px login-streak-2 flex justify-end">
          <div className="h-full w-2/5 bg-gradient-to-l from-transparent via-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-[78%] left-0 w-full h-px login-streak-3">
          <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Subtle corner glows */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/[0.06] rounded-full blur-3xl login-glow-1" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-violet-500/[0.05] rounded-full blur-3xl login-glow-2" />

        {/* Center content */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center mx-auto mb-6 login-logo-float">
            <svg className="w-7 h-7 text-white/90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-white tracking-tight mb-3">
            Spacejoy
          </h2>
          <p className="text-white/30 text-sm">
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="absolute top-5 right-5 z-50 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        <div className="w-full max-w-sm animate-fade-in-scale">
          {/* Mobile logo (hidden on desktop since left panel has it) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <svg className="w-6 h-6 text-background" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@spacejoy.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl animate-fade-in">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-11 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Spacejoy Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
}
