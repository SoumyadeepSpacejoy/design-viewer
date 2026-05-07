"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DesignerSummary } from "@/app/types";
import { fetchDesignersList } from "@/app/clientApi";
import PageLoader from "./PageLoader";

export default function DesignerWorkList() {
  const router = useRouter();
  const [designers, setDesigners] = useState<DesignerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDesignersList();
        setDesigners(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = designers.filter((d) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <PageLoader message="Loading designers..." />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Designer Work</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a designer to view their projects and time-filtered earnings.
        </p>
      </div>

      <div className="mb-4 relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input h-9 text-sm"
          style={{ paddingLeft: "2.5rem" }}
          placeholder="Search by name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-items">
        {filtered.map((designer) => (
          <button
            key={designer._id}
            onClick={() => router.push(`/designer-work/${designer._id}`)}
            className="card card-interactive p-4 text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
              {designer.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {designer.name || "Unnamed"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{designer.email}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {designer.trackerCount} {designer.trackerCount === 1 ? "project" : "projects"}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-sm text-muted-foreground">No designers found.</p>
        </div>
      )}
    </div>
  );
}
