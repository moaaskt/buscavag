"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, ChevronUp } from "lucide-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useRef, useState } from "react";
import Link from "next/link";

export interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: () => void;
  active?: boolean;
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

export const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("fixed bottom-5 right-5 z-50 block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="mobileFloatingNav"
            className="absolute right-0 bottom-full mb-3 flex flex-col items-end gap-2.5"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 10,
                  transition: {
                    delay: idx * 0.04,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.04 }}
                className="flex items-center gap-2"
              >
                <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-md backdrop-blur-md">
                  {item.title}
                </span>
                {item.onClick ? (
                  <button
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-95",
                      item.active
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                        : "border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-95",
                      item.active
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                        : "border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border shadow-xl backdrop-blur-md transition-all active:scale-90",
          open
            ? "border-emerald-500/50 bg-emerald-500 text-white"
            : "border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200"
        )}
        aria-label="Abrir Menu Flutuante"
      >
        <LayoutGrid className={cn("h-5 w-5 transition-transform duration-200", open && "rotate-45")} />
      </button>
    </div>
  );
};

export const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 px-4 pb-3 shadow-xl backdrop-blur-md md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
  active,
}: FloatingDockItem & {
  mouseX: MotionValue;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 72, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 72, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 36, 20],
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-full border transition-colors",
        active
          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300"
      )}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="absolute -top-8 left-1/2 w-fit rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium whitespace-pre text-zinc-100 shadow-md"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="cursor-pointer">
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}
