"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    roles: ["designer", "admin", "owner"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "designs",
    label: "AI Designs",
    href: "/designs",
    roles: ["admin", "owner"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Design Order Analytics",
    href: "/analytics",
    roles: ["admin", "owner"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    href: "/users",
    roles: ["admin", "owner"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem("user_name");
    const role = localStorage.getItem("user_role");
    if (name) setUserName(name);
    setUserRole(role);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = navItems.filter(
    (item) => !userRole || item.roles.includes(userRole),
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    router.push("/login");
    window.dispatchEvent(new Event("storage"));
  };

  const handleThemeToggle = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty("--toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--toggle-y", `${y}px`);
    setTheme(theme === "dark" ? "light" : theme === "light" ? "dark" : "light");
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-icon btn-ghost"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">Spacejoy</span>
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {initial}
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-base font-semibold text-foreground tracking-tight animate-fade-in">
              Spacejoy
            </span>
          )}

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${collapsed ? "" : "ml-auto"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative
                  ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                  ${active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <span className={`flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
                {active && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full`} />
                )}

                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={handleThemeToggle}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground hover:bg-secondary hover:text-foreground transition-all ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? "Toggle theme" : undefined}
            >
              <span className="shrink-0 text-muted-foreground">
                {theme === "dark" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" /><path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" /><path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </span>
              {!collapsed && (
                <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              )}
            </button>
          )}

          {/* User avatar with dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary transition-all ${collapsed ? "justify-center px-2" : ""} ${userMenuOpen ? "bg-secondary" : ""}`}
              title={collapsed ? userName : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#333] to-[#555] dark:from-[#555] dark:to-[#888] flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-white">{initial}</span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{userRole || "user"}</p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-muted-foreground transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className={`absolute ${collapsed ? "left-full ml-2 bottom-0" : "left-0 right-0 bottom-full mb-1"} card p-1.5 shadow-xl z-50 animate-fade-in`}>
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{userRole || "user"}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
