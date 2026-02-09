"use client";

import React, { useState, useEffect } from "react";

interface SelectionGridProps {
  onSelect: (
    feature:
      | "ai-designs"
      | "push-notifications"
      | "my-project-tracker"
      | "track-designers"
      | "render",
  ) => void;
}

interface FeatureItem {
  id:
    | "ai-designs"
    | "push-notifications"
    | "my-project-tracker"
    | "track-designers"
    | "render";
  title: string;
  description: string;
  icon: React.ReactNode;
  roles: string[];
}

export default function SelectionGrid({ onSelect }: SelectionGridProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setUserRole(role);
    setIsLoading(false);
  }, []);

  const features: FeatureItem[] = [
    {
      id: "my-project-tracker",
      title: "Project Tracker",
      description: "Manage your design projects and timelines with ease.",
      roles: ["designer", "admin", "owner"],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      id: "render",
      title: "Photorealistic Render",
      description: "Generate high-quality visuals for your interior designs.",
      roles: ["designer", "admin", "owner"],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 21 1.9-1.9a4.4 4.4 0 1 1 2-2L3 21Z" />
          <path d="M9 15l10-10" />
          <path d="M19 9l2 2" />
          <path d="M17 3l2 2" />
        </svg>
      ),
    },
    {
      id: "ai-designs",
      title: "AI Design Explorer",
      description:
        "Explore neural generated interior architectures and inspirations.",
      roles: ["admin", "owner"],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v8" />
          <path d="m4.93 4.93 5.66 5.66" />
          <path d="M2 12h8" />
          <path d="m4.93 19.07 5.66-5.66" />
          <path d="M12 22v-8" />
          <path d="m19.07 19.07-5.66-5.66" />
          <path d="M22 12h-8" />
          <path d="m19.07 4.93-5.66 5.66" />
        </svg>
      ),
    },
    {
      id: "track-designers",
      title: "Designer Insights",
      description: "Monitor and manage performance across the design team.",
      roles: ["admin", "owner"],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "push-notifications",
      title: "Broadcast Portal",
      description: "Send and manage real-time updates and notifications.",
      roles: ["admin", "owner"],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
    },
  ];

  const filteredFeatures = features.filter(
    (f) => !userRole || f.roles.includes(userRole),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-6">
          Synchronizing Experience...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-16 sm:mb-24">
        <h1 className="text-4xl sm:text-6xl font-medium tracking-tight mb-6 text-foreground">
          Precision <span className="text-primary font-bold">Intelligence</span>
        </h1>
        <p className="text-muted-foreground font-medium max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Select an optimized module to begin your professional workflow. Our
          AI-driven suite is tailored for high-performance design teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 stagger-items">
        {filteredFeatures.map((feature) => (
          <div
            key={feature.id}
            className="premium-card group cursor-pointer p-8 sm:p-10 flex flex-col gap-6"
            onClick={() => onSelect(feature.id)}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
              {feature.icon}
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground/90 font-medium text-sm leading-relaxed line-clamp-2">
                {feature.description}
              </p>
            </div>

            <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
              Initialize Module
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
