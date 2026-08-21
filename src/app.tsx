import { MetaProvider, Title, Meta } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import AuthGuard from "~/components/AuthGuard";
import PageLoader from "~/components/PageLoader";
import { ThemeProvider } from "~/components/ThemeContext";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Spacejoy Admin</Title>
          <Meta
            name="description"
            content="Spacejoy admin dashboard and design management portal"
          />
          <ThemeProvider>
            <AuthGuard>
              <Suspense
                fallback={
                  <div class="min-h-screen bg-background flex items-center justify-center">
                    <PageLoader />
                  </div>
                }
              >
                {props.children}
              </Suspense>
            </AuthGuard>
          </ThemeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
