import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show, type JSX } from "solid-js";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "./ThemeContext";

interface NavItem {
  id: string;
  label: string;
  href: string;
  // A factory, not a stored element: Solid JSX creates real DOM nodes eagerly,
  // and a single node can't be mounted in more than one place.
  icon: () => JSX.Element;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    roles: ["designer", "admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "tracker",
    label: "Project Tracker",
    href: "/tracker",
    roles: ["designer", "admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "render",
    label: "Render",
    href: "/render",
    roles: ["designer", "admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "designs",
    label: "AI Designs",
    href: "/designs",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "asset-management",
    label: "Asset Management",
    href: "/asset-management",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Design Order Analytics",
    href: "/analytics",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/notifications",
    roles: ["admin", "owner"],
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = createSignal(false);
  const [userName, setUserName] = createSignal("User");
  const [userRole, setUserRole] = createSignal<string | null>(null);
  const [mounted, setMounted] = createSignal(false);
  const [userMenuOpen, setUserMenuOpen] = createSignal(false);
  let userMenuRef: HTMLDivElement | undefined;

  onMount(() => {
    setMounted(true);
    const name = localStorage.getItem("user_name");
    const role = localStorage.getItem("user_role");
    if (name) setUserName(name);
    setUserRole(role);

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef && !userMenuRef.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  });

  const filteredItems = () =>
    navItems.filter((item) => !userRole() || item.roles.includes(userRole()!));

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    navigate("/login");
    window.dispatchEvent(new Event("storage"));
  };

  const handleThemeToggle = (e: MouseEvent) => {
    document.documentElement.style.setProperty("--toggle-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--toggle-y", `${e.clientY}px`);
    setTheme(theme() === "dark" ? "light" : theme() === "light" ? "dark" : "light");
  };

  const initial = () => userName().charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile top bar */}
      <div class="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} class="btn-icon btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <span class="text-sm font-semibold text-foreground">Spacejoy</span>
        <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {initial()}
        </div>
      </div>

      {/* Mobile overlay */}
      <Show when={mobileOpen()}>
        <div
          class="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      </Show>

      {/* Sidebar */}
      <aside
        class={`fixed top-0 left-0 z-50 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out
          ${collapsed() ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen() ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div class={`h-16 flex items-center border-b border-sidebar-border px-4 ${collapsed() ? "justify-center" : "gap-3"}`}>
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <Show when={!collapsed()}>
            <span class="text-base font-semibold text-foreground tracking-tight animate-fade-in">
              Spacejoy
            </span>
          </Show>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed())}
            class={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${collapsed() ? "" : "ml-auto"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class={`transition-transform duration-300 ${collapsed() ? "rotate-180" : ""}`}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            class="lg:hidden ml-auto w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <For each={filteredItems()}>
            {(item) => (
              <button
                onClick={() => {
                  navigate(item.href);
                  setMobileOpen(false);
                }}
                class={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative
                  ${collapsed() ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                  ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                  }
                `}
                title={collapsed() ? item.label : undefined}
              >
                <span class={`flex-shrink-0 ${isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {item.icon()}
                </span>
                <Show when={!collapsed()}>
                  <span class="text-sm truncate">{item.label}</span>
                </Show>
                <Show when={isActive(item.href)}>
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                </Show>

                {/* Tooltip for collapsed */}
                <Show when={collapsed()}>
                  <div class="absolute left-full ml-2 px-2.5 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                </Show>
              </button>
            )}
          </For>
        </nav>

        {/* Bottom section */}
        <div class="border-t border-sidebar-border p-3 space-y-1">
          {/* Theme toggle */}
          <Show when={mounted()}>
            <button
              onClick={handleThemeToggle}
              class={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground hover:bg-secondary hover:text-foreground transition-all ${collapsed() ? "justify-center px-2" : ""}`}
              title={collapsed() ? "Toggle theme" : undefined}
            >
              <span class="shrink-0 text-muted-foreground">
                <Show
                  when={theme() === "dark"}
                  fallback={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" /><path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" /><path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                </Show>
              </span>
              <Show when={!collapsed()}>
                <span class="text-sm">{theme() === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </Show>
            </button>
          </Show>

          {/* User avatar with dropdown */}
          <div class="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen())}
              class={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary transition-all ${collapsed() ? "justify-center px-2" : ""} ${userMenuOpen() ? "bg-secondary" : ""}`}
              title={collapsed() ? userName() : undefined}
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#333] to-[#555] dark:from-[#555] dark:to-[#888] flex items-center justify-center shrink-0">
                <span class="text-sm font-semibold text-white">{initial()}</span>
              </div>
              <Show when={!collapsed()}>
                <div class="flex-1 min-w-0 text-left">
                  <p class="text-sm font-medium text-foreground truncate">{userName()}</p>
                  <p class="text-[11px] text-muted-foreground capitalize">{userRole() || "user"}</p>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class={`text-muted-foreground transition-transform duration-200 ${userMenuOpen() ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Show>
            </button>

            {/* Dropdown */}
            <Show when={userMenuOpen()}>
              <div class={`absolute ${collapsed() ? "left-full ml-2 bottom-0" : "left-0 right-0 bottom-full mb-1"} card p-1.5 shadow-xl z-50 animate-fade-in`}>
                <div class="px-3 py-2 border-b border-border mb-1">
                  <p class="text-sm font-medium text-foreground truncate">{userName()}</p>
                  <p class="text-[11px] text-muted-foreground capitalize">{userRole() || "user"}</p>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </Show>
          </div>
        </div>
      </aside>
    </>
  );
}
