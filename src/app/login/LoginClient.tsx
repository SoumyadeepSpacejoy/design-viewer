"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InteractiveBackground from "@/components/InteractiveBackground";

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

        if (userRole === "customer") {
          setError("Access denied. Only admins can login! 🫩");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.data.token);
        // Store user metadata if available
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <InteractiveBackground />

      <div className="relative w-full max-w-md glass-panel rounded-[3rem] p-8 sm:p-12 border border-pink-500/20 shadow-2xl overflow-hidden">
        {/* Glow behind logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-pink-500/10 blur-[50px] rounded-full -z-10"></div>

        {/* Logo/Icon */}
        <div className="flex justify-center mb-10">
          <div className="relative p-5 bg-black/40 rounded-3xl border border-pink-500/20 shadow-inner">
            <svg
              className="w-12 h-12 text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <div className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_10px_#f472b6]"></div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-pink-100 tracking-tight mb-3 text-pink-shadow">
            Spacejoy <span className="text-pink-400 font-medium">Portal</span>
          </h1>
          <p className="text-pink-300/60 font-light text-sm tracking-wide">
            ENTER THE FUTURE OF DESIGN
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-pink-400/80 uppercase tracking-widest ml-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-black/40 border border-pink-500/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all duration-300 text-pink-100 placeholder-pink-900/50"
              placeholder="explorer@spacejoy.ai"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-pink-400/80 uppercase tracking-widest ml-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-black/40 border border-pink-500/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all duration-300 text-pink-100 placeholder-pink-900/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-sm rounded-2xl animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
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
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(236,72,153,0.3)] transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>ACCESSING...</span>
              </div>
            ) : (
              "INFILTRATE"
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 opacity-30">
            <div className="w-12 h-px bg-pink-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
            <div className="w-12 h-px bg-pink-500/50"></div>
          </div>
          <p className="mt-6 text-[10px] text-pink-500/40 font-bold uppercase tracking-[0.3em]">
            Curated by Artificial Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
