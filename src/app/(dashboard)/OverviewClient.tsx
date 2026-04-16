"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";

interface StatCard {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
];

export default function OverviewClient() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");
    setUserRole(role);
    if (name) setUserName(name);
    setIsLoading(false);
  }, []);

  const filtered = features.filter(
    (f) => !userRole || f.roles.includes(userRole),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          {getGreeting()}, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s available in your workspace.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-items">
        {filtered.map((feature) => (
          <button
            key={feature.id}
            onClick={() => router.push(feature.href)}
            className="card card-interactive p-6 text-left group"
          >
            <div className={`w-10 h-10 rounded-xl ${feature.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
              {feature.icon}
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
              {feature.label}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Open
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
