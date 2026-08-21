import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createSignal, onCleanup, onMount, Show, type JSX } from "solid-js";
import PageLoader from "./PageLoader";

export default function AuthGuard(props: { children: JSX.Element }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = createSignal(false);
  const [loading, setLoading] = createSignal(true);

  const authCheck = () => {
    const token = localStorage.getItem("token");
    const pathname = location.pathname;

    if (!token) {
      if (pathname !== "/login") {
        setAuthorized(false);
        navigate("/login", { replace: true });
      } else {
        setAuthorized(true);
      }
    } else {
      if (pathname === "/login") {
        setAuthorized(false);
        navigate("/", { replace: true });
      } else {
        setAuthorized(true);
      }
    }
    setLoading(false);
  };

  // Effects don't run during SSR, so localStorage is always available here.
  // Reading location.pathname inside authCheck makes this re-run on navigation.
  createEffect(authCheck);

  onMount(() => {
    window.addEventListener("storage", authCheck);
    onCleanup(() => window.removeEventListener("storage", authCheck));
  });

  return (
    <Show
      when={!loading()}
      fallback={
        <div class="min-h-screen bg-background flex items-center justify-center">
          <PageLoader />
        </div>
      }
    >
      <Show when={authorized()}>{props.children}</Show>
    </Show>
  );
}
