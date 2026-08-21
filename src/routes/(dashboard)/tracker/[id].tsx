import { useNavigate, useParams } from "@solidjs/router";
import { createResource, Match, Switch } from "solid-js";
import { fetchTimeTracker } from "~/lib/clientApi";
import PageLoader from "~/components/PageLoader";
import TrackerDetail from "~/components/TrackerDetail";

export default function TrackerDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tracker] = createResource(
    () => params.id,
    async (id) => {
      try {
        return await fetchTimeTracker(id);
      } catch (error) {
        console.error("Failed to load tracker:", error);
        return null;
      }
    },
  );

  return (
    <Switch>
      <Match when={tracker.loading}>
        <PageLoader message="Loading project..." />
      </Match>
      <Match when={tracker()}>
        {(t) => (
          <TrackerDetail tracker={t()} onBack={() => navigate("/tracker")} />
        )}
      </Match>
      <Match when={!tracker.loading && !tracker()}>
        <div class="card py-12 text-center">
          <p class="text-sm text-muted-foreground">Tracker not found.</p>
          <button
            onClick={() => navigate("/tracker")}
            class="btn btn-ghost btn-sm mt-4"
          >
            Back to Tracker
          </button>
        </div>
      </Match>
    </Switch>
  );
}
