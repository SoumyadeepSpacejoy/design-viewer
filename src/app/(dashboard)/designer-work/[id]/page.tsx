"use client";

import { useParams, useRouter } from "next/navigation";
import DesignerWorkDetail from "@/components/DesignerWorkDetail";

export default function DesignerWorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => router.push("/designer-work")}
        className="btn btn-ghost btn-sm mb-4 gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Designers
      </button>
      <DesignerWorkDetail designerId={id} />
    </div>
  );
}
