import { Suspense } from "react";
import HomeClient from "./HomeClient";

export const runtime = "edge";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
