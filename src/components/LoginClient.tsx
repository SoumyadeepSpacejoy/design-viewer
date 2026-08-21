import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { useTheme } from "./ThemeContext";

export default function LoginClient() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogin = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.spacejoy.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      });

      const data = await response.json();

      if (response.ok && data.data?.token) {
        const userRole = data.data.user?.role;
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user_role", userRole || "unknown");
        if (data.data.user?.name) {
          localStorage.setItem("user_name", data.data.user.name);
        }
        navigate("/");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = (e: MouseEvent) => {
    document.documentElement.style.setProperty("--toggle-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--toggle-y", `${e.clientY}px`);
    setTheme(theme() === "dark" ? "light" : "dark");
  };

  return (
    <div class="min-h-screen flex bg-background">
      {/* ── Left: Abstract animated panel ── */}
      <div class="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-[#0a0a0a] items-center justify-center">
        {/* Mesh gradient background */}
        <div class="absolute inset-0">
          <div
            class="absolute inset-0 login-mesh-rotate"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, #0a0a0a 0deg, #1a1a2e 60deg, #0a0a0a 120deg, #16213e 180deg, #0a0a0a 240deg, #1a1a2e 300deg, #0a0a0a 360deg)",
            }}
          />
          <div
            class="absolute inset-0 login-mesh-counter"
            style={{
              background:
                "conic-gradient(from 180deg at 40% 60%, transparent 0deg, rgba(99,102,241,0.08) 90deg, transparent 180deg, rgba(139,92,246,0.06) 270deg, transparent 360deg)",
            }}
          />
        </div>

        {/* Noise texture overlay */}
        <div
          class="absolute inset-0 opacity-[0.35]"
          style={{
            "background-image": `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            "background-size": "128px 128px",
          }}
        />

        {/* Horizontal light streaks */}
        <div class="absolute top-[25%] left-0 w-full h-px login-streak-1">
          <div class="h-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>
        <div class="absolute top-[55%] right-0 w-full h-px login-streak-2 flex justify-end">
          <div class="h-full w-2/5 bg-gradient-to-l from-transparent via-white/[0.05] to-transparent" />
        </div>
        <div class="absolute top-[78%] left-0 w-full h-px login-streak-3">
          <div class="h-full w-1/4 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Subtle corner glows */}
        <div class="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/[0.06] rounded-full blur-3xl login-glow-1" />
        <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-violet-500/[0.05] rounded-full blur-3xl login-glow-2" />

        {/* Center content */}
        <div class="relative z-10 text-center px-12 max-w-lg">
          <div class="w-14 h-14 rounded-2xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center mx-auto mb-6 login-logo-float">
            <svg class="w-7 h-7 text-white/90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <h2 class="text-3xl font-semibold text-white tracking-tight mb-3">Spacejoy</h2>
          <p class="text-white/30 text-sm">Admin Dashboard</p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          class="absolute top-5 right-5 z-50 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <Show
            when={theme() === "dark"}
            fallback={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </Show>
        </button>

        <div class="w-full max-w-sm animate-fade-in-scale">
          {/* Mobile logo (hidden on desktop since left panel has it) */}
          <div class="flex justify-center mb-8 lg:hidden">
            <div class="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <svg class="w-6 h-6 text-background" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
          </div>

          <div class="mb-8">
            <h1 class="text-2xl font-semibold text-foreground tracking-tight">Welcome back</h1>
            <p class="text-sm text-muted-foreground mt-1.5">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="input"
                placeholder="you@spacejoy.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                class="input"
                placeholder="Enter your password"
              />
            </div>

            <Show when={error()}>
              <div class="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl animate-fade-in">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error()}
              </div>
            </Show>

            <button type="submit" disabled={loading()} class="btn btn-primary w-full h-11 mt-2">
              <Show when={loading()} fallback="Sign in">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </div>
              </Show>
            </button>
          </form>

          <p class="text-center text-xs text-muted-foreground mt-8">Spacejoy Admin Portal</p>
        </div>
      </div>
    </div>
  );
}
