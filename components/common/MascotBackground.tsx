"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import MascotImg from "@/public/cenot-drice-logo.png";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PawParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const PawIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Main metacarpal pad */}
    <path d="M50 48 C34 48 25 62 28 76 C30 85 39 90 50 90 C61 90 70 85 72 76 C75 62 66 48 50 48 Z" />
    {/* 4 Toe beans */}
    <ellipse cx="22" cy="38" rx="8.5" ry="11" transform="rotate(-24 22 38)" />
    <ellipse cx="40" cy="26" rx="8.5" ry="12" transform="rotate(-8 40 26)" />
    <ellipse cx="60" cy="26" rx="8.5" ry="12" transform="rotate(8 60 26)" />
    <ellipse cx="78" cy="38" rx="8.5" ry="11" transform="rotate(24 78 38)" />
  </svg>
);

function MascotBackgroundComponent() {
  const [pawParticles, setPawParticles] = useState<PawParticle[]>([]);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveSidebarOpen = mounted ? isSidebarOpen : true;

  useEffect(() => {
    let particleId = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX =
        "clientX" in e ? e.clientX : (e.touches?.[0]?.clientX ?? 0);
      const clientY =
        "clientY" in e ? e.clientY : (e.touches?.[0]?.clientY ?? 0);

      if (!clientX && !clientY) return;

      const newParticle: PawParticle = {
        id: ++particleId,
        x: clientX,
        y: clientY,
        rotation: (Math.random() - 0.5) * 36,
        scale: 0.85 + Math.random() * 0.3,
      };

      setPawParticles((prev) => [...prev.slice(-7), newParticle]);
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const removeParticle = (id: number) => {
    setPawParticles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Ambient background paw prints */}
      <div className="absolute inset-0 opacity-25 dark:opacity-20">
        {/* Paw 1: Lower-left near mascot */}
        <motion.div
          className={cn(
            "absolute bottom-28 text-primary/30 dark:text-blue-400/25 w-10 h-10 transition-all duration-300 ease-out",
            effectiveSidebarOpen
              ? "left-36 sm:left-48 lg:left-[22rem]"
              : "left-36 sm:left-48 lg:left-56",
          )}
          animate={{
            y: [0, -8, 0],
            rotate: [15, 22, 15],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <PawIcon className="w-full h-full" />
        </motion.div>

        {/* Paw 2: Lower-middle drifting paw */}
        <motion.div
          className={cn(
            "absolute bottom-16 text-primary/20 dark:text-blue-300/20 w-8 h-8 hidden sm:block transition-all duration-300 ease-out",
            effectiveSidebarOpen
              ? "left-64 sm:left-72 lg:left-[28rem]"
              : "left-64 sm:left-72 lg:left-80",
          )}
          animate={{
            y: [0, -10, 0],
            rotate: [-10, -5, -10],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6,
            delay: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <PawIcon className="w-full h-full" />
        </motion.div>

        {/* Paw 3: Floating soft paw near head */}
        <motion.div
          className={cn(
            "absolute bottom-40 text-primary/25 dark:text-blue-400/20 w-7 h-7 transition-all duration-300 ease-out",
            effectiveSidebarOpen
              ? "left-16 sm:left-24 lg:left-[18rem]"
              : "left-16 sm:left-24 lg:left-28",
          )}
          animate={{
            y: [0, -6, 0],
            rotate: [28, 35, 28],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 4.5,
            delay: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <PawIcon className="w-full h-full" />
        </motion.div>
      </div>

      {/* Cat Mascot Peeking from bottom-left */}
      <motion.div
        className={cn(
          "absolute -bottom-8 sm:-bottom-12 w-64 h-64 sm:w-80 sm:h-80 lg:w-[26rem] lg:h-[26rem] xl:w-[30rem] xl:h-[30rem] transition-all duration-300 ease-out",
          effectiveSidebarOpen
            ? "left-[-3rem] sm:left-[-2rem] lg:left-44 xl:left-56"
            : "left-[-3rem] sm:left-[-2rem] lg:left-6 xl:left-12",
        )}
        initial={{ y: 80, opacity: 0, rotate: 14 }}
        animate={{
          y: [0, -10, 0],
          rotate: [18, 21, 18],
          opacity: 1,
        }}
        transition={{
          y: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          },
          opacity: {
            duration: 0.8,
            ease: "easeOut",
          },
        }}
      >
        <div className="relative w-full h-full opacity-80 dark:opacity-75 drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <Image
            src={MascotImg}
            alt="Mascot"
            fill
            sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 480px"
            className="object-contain"
            priority={false}
          />
        </div>
      </motion.div>

      {/* Interactive Paw Click Effect Particles */}
      <AnimatePresence>
        {pawParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x - 20,
              y: particle.y - 20,
              scale: 0.3 * particle.scale,
              rotate: particle.rotation,
              opacity: 0.85,
            }}
            animate={{
              scale: [
                0.3 * particle.scale,
                1.1 * particle.scale,
                0.9 * particle.scale,
              ],
              y: particle.y - 45,
              opacity: [0.85, 0.7, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
            onAnimationComplete={() => removeParticle(particle.id)}
            className="absolute text-primary/70 dark:text-blue-400/80 w-10 h-10 pointer-events-none drop-shadow-sm"
          >
            <PawIcon className="w-full h-full" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const MascotBackground = memo(MascotBackgroundComponent);
