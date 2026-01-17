"use client";

import { useEffect, useState, useCallback } from "react";

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: string;
  duration: string;
}

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [orbs, setOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    // Generate static orbs initially
    const initialOrbs = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 200,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 10}s`,
    }));
    setOrbs(initialOrbs);

    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for performance
      requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Moving mouse-follower glow */}
      <div
        className="absolute w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[120px] transition-transform duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1)"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: `translate(-50%, -50%) scale(${1 + Math.sin(Date.now() / 1000) * 0.1})`,
        }}
      />

      {/* Static/Floating Background Orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute bg-pink-600/10 rounded-full blur-[100px] animate-pulse"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            transform: `translate(-50%, -50%) translate3d(${
              (mousePosition.x - 50) * (0.05 + orb.id * 0.01)
            }%, ${(mousePosition.y - 50) * (0.05 + orb.id * 0.01)}%, 0)`,
            transition: "transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      ))}

      {/* Grain/Noise Overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-screen pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
}
