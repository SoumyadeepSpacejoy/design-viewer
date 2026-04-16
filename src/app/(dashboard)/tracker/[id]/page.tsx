"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchTimeTracker } from "@/app/clientApi";
import { TimeTracker } from "@/app/types";
import TrackerDetail from "@/components/TrackerDetail";
import PageLoader from "@/components/PageLoader";

export default function TrackerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tracker, setTracker] = useState<TimeTracker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedId = useRef<string | null>(null);

  useEffect(() => {
    if (!id || loadedId.current === id) return;
    loadedId.current = id;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTimeTracker(id);
        if (data) setTracker(data);
      } catch (error) {
        console.error("Failed to load tracker:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return <PageLoader message="Loading project..." />;
  }

  if (!tracker) {
    return (
      <div className="card py-12 text-center">
        <p className="text-sm text-muted-foreground">Tracker not found.</p>
        <button onClick={() => router.push("/tracker")} className="btn btn-ghost btn-sm mt-4">
          Back to Tracker
        </button>
      </div>
    );
  }

  return <TrackerDetail tracker={tracker} onBack={() => router.push("/tracker")} />;
}
