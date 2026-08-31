"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import MascotImg from "@/public/cenot-drice-logo.png";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function MascotBackgroundComponent() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveSidebarOpen = mounted ? isSidebarOpen : true;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Cat Mascot Peeking from bottom-left */}
      <div
        className={cn(
          "absolute -bottom-8 sm:-bottom-12 w-64 h-64 sm:w-80 sm:h-80 lg:w-[26rem] lg:h-[26rem] xl:w-[30rem] xl:h-[30rem] transform rotate-[19deg] transition-all duration-300 ease-out",
          effectiveSidebarOpen
            ? "left-[-3rem] sm:left-[-2rem] lg:left-44 xl:left-56"
            : "left-[-3rem] sm:left-[-2rem] lg:left-6 xl:left-12",
        )}
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
      </div>
    </div>
  );
}

export const MascotBackground = memo(MascotBackgroundComponent);
