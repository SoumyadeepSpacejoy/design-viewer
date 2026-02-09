"use client";

import { useEffect, useState, useRef } from "react";

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
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const requestRef = useRef<number>(null);
  const mousePosRef = useRef({ x: 50, y: 50 });
  const currentPosRef = useRef({ x: 50, y: 50 });

  useEffect(() => {
    // Generate static orbs with speed for parallax
    const initialOrbs = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 400 + 300,
      delay: `${Math.random() * 2}s`,
      duration: `${Math.random() * 8 + 10}s`,
      speed: Math.random() * 0.02 + 0.01,
    }));
    setOrbs(initialOrbs);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    const animate = () => {
      // ultra-smooth lerp
      const lerpFactor = 0.05;
      currentPosRef.current.x +=
        (mousePosRef.current.x - currentPosRef.current.x) * lerpFactor;
      currentPosRef.current.y +=
        (mousePosRef.current.y - currentPosRef.current.y) * lerpFactor;

      document.documentElement.style.setProperty(
        "--mouse-x",
        `${currentPosRef.current.x}%`,
      );
      document.documentElement.style.setProperty(
        "--mouse-y",
        `${currentPosRef.current.y}%`,
      );

      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-background transition-colors duration-1000">
      {/* Moving mouse-follower glow */}
      <div
        className="absolute w-[1200px] h-[1200px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[140px] pointer-events-none z-0"
        style={{
          left: `var(--mouse-x, 50%)`,
          top: `var(--mouse-y, 50%)`,
          transform: `translate(-50%, -50%)`,
        }}
      />

      {/* Parallax Background Orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            transform: `translate(-50%, -50%) translate3d(${
              (currentPosRef.current.x - 50) * orb.speed
            }px, ${(currentPosRef.current.y - 50) * orb.speed}px, 0)`,
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.1] dark:opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(var(--primary) 0.5px, transparent 0.5px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Overlay Mesh Pattern */}
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-soft-light" />

      {/* Radial depth gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--background)_100%)] opacity-60" />

      {/* Grain/Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
