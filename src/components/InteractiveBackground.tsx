import { createSignal, For, onCleanup, onMount } from "solid-js";

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: string;
  duration: string;
  speed: number;
}

export default function InteractiveBackground() {
  const [orbs, setOrbs] = createSignal<Orb[]>([]);
  let requestRef: number | undefined;
  const mousePos = { x: 50, y: 50 };
  const currentPos = { x: 50, y: 50 };

  onMount(() => {
    // Generate static orbs with speed for parallax
    setOrbs(
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 400 + 300,
        delay: `${Math.random() * 2}s`,
        duration: `${Math.random() * 8 + 10}s`,
        speed: Math.random() * 0.02 + 0.01,
      })),
    );

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = (e.clientX / window.innerWidth) * 100;
      mousePos.y = (e.clientY / window.innerHeight) * 100;
    };

    const animate = () => {
      // ultra-smooth lerp
      const lerpFactor = 0.05;
      currentPos.x += (mousePos.x - currentPos.x) * lerpFactor;
      currentPos.y += (mousePos.y - currentPos.y) * lerpFactor;

      document.documentElement.style.setProperty("--mouse-x", `${currentPos.x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${currentPos.y}%`);

      requestRef = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    requestRef = requestAnimationFrame(animate);

    onCleanup(() => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef) cancelAnimationFrame(requestRef);
    });
  });

  return (
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-background transition-colors duration-1000">
      {/* Moving mouse-follower glow */}
      <div
        class="absolute w-[1200px] h-[1200px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[140px] pointer-events-none z-0"
        style={{
          left: "var(--mouse-x, 50%)",
          top: "var(--mouse-y, 50%)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Parallax Background Orbs */}
      <For each={orbs()}>
        {(orb) => (
          <div
            class="absolute bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              "animation-delay": orb.delay,
              "animation-duration": orb.duration,
              transform: `translate(-50%, -50%) translate3d(${
                (currentPos.x - 50) * orb.speed
              }px, ${(currentPos.y - 50) * orb.speed}px, 0)`,
            }}
          />
        )}
      </For>

      {/* Grid Pattern Overlay */}
      <div
        class="absolute inset-0 opacity-[0.1] dark:opacity-[0.2] pointer-events-none"
        style={{
          "background-image": "radial-gradient(var(--primary) 0.5px, transparent 0.5px)",
          "background-size": "30px 30px",
        }}
      />

      {/* Overlay Mesh Pattern */}
      <div class="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-soft-light" />

      {/* Radial depth gradient */}
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--background)_100%)] opacity-60" />

      {/* Grain/Noise Overlay */}
      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
