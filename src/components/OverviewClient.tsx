import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount, Show, type JSX } from "solid-js";
import PageLoader from "./PageLoader";

interface StatCard {
  id: string;
  label: string;
  href: string;
  description: string;
  // Factory, not a stored element — see Sidebar for the same reason.
  icon: () => JSX.Element;
  color: string;
  roles: string[];
}

const features: StatCard[] = [
  {
    id: "tracker",
    label: "Project Tracker",
    href: "/tracker",
    description: "Track design projects, manage timelines, and monitor progress across all active work.",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    roles: ["designer", "admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "render",
    label: "Photorealistic Render",
    href: "/render",
    description: "Generate high-fidelity architectural visualizations from interior design images.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    roles: ["designer", "admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "designs",
    label: "AI Design Explorer",
    href: "/designs",
    description: "Browse AI-generated interior designs, compare before and after transformations.",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: "designers",
    label: "Designer Insights",
    href: "/designers",
    description: "Monitor team performance, track time utilization, and analyze earnings data.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "designer-work",
    label: "Designer Work",
    href: "/designer-work",
    description: "View per-designer projects and date-filtered time and earnings for payroll.",
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Design Order Analytics",
    href: "/analytics",
    description: "Track design orders, revenue, monthly trends, and customer payment data.",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Broadcast Portal",
    href: "/notifications",
    description: "Create, schedule, and manage push notifications for app users.",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    description: "Generate and download CSV reports like Design Ready Data for selected date ranges.",
    color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <line x1="10" x2="8" y1="9" y2="9" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    href: "/users",
    description: "Search users by email or name, filter by signup date, and impersonate accounts.",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function OverviewClient() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = createSignal<string | null>(null);
  const [userName, setUserName] = createSignal("User");
  const [greeting, setGreeting] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(() => {
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");
    setUserRole(role);
    if (name) setUserName(name);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setIsLoading(false);
  });

  const filtered = () =>
    features.filter((f) => !userRole() || f.roles.includes(userRole()!));

  return (
    <Show when={!isLoading()} fallback={<PageLoader message="Loading dashboard..." />}>
      <div class="animate-fade-in">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {greeting()}, {userName().split(" ")[0]}
          </h1>
          <p class="text-muted-foreground mt-1 text-sm">
            Here's what's available in your workspace.
          </p>
        </div>

        {/* Feature cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-items">
          <For each={filtered()}>
            {(feature) => (
              <button
                onClick={() => navigate(feature.href)}
                class="card card-interactive p-6 text-left group"
              >
                <div class={`w-10 h-10 rounded-xl ${feature.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon()}
                </div>
                <h3 class="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {feature.label}
                </h3>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div class="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-0.5 transition-transform">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
