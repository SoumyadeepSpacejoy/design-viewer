import { useNavigate, useParams } from "@solidjs/router";
import AdminTrackerDetail from "~/components/AdminTrackerDetail";

export default function DesignerDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div class="animate-fade-in">
      <button
        onClick={() => navigate("/designers")}
        class="btn btn-ghost btn-sm mb-4 gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Dashboard
      </button>
      <AdminTrackerDetail trackerId={params.id} />
    </div>
  );
}
