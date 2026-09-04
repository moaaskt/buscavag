"use client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    icon?: React.ElementType;
    active?: boolean;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResizableNavbarContainer = ({ children, className }: NavbarProps) => {
  const [visible, setVisible] = useState<boolean>(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      className={cn("sticky inset-x-0 top-3 z-50 w-full px-4", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px)" : "blur(8px)",
        boxShadow: visible
          ? "0 0 24px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : "0 0 0 1px rgba(255, 255, 255, 0.05)",
        width: visible ? "85%" : "100%",
        y: visible ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 30,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 px-4 py-2.5 transition-colors duration-200 lg:flex",
        visible && "bg-white/90 dark:bg-zinc-950/90 shadow-lg border-zinc-300 dark:border-zinc-700/60",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "relative flex flex-row items-center space-x-1 text-xs font-medium",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <a
            key={`link-${idx}`}
            href={item.link}
            onMouseEnter={() => setHovered(idx)}
            onClick={onItemClick}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors",
              item.active
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200",
            )}
          >
            {hovered === idx && (
              <motion.div
                layoutId="navHovered"
                className="absolute inset-0 h-full w-full rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            {item.active && hovered !== idx && (
              <div className="absolute inset-0 h-full w-full rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800" />
            )}
            {Icon && (
              <Icon
                className={cn(
                  "relative z-20 h-3.5 w-3.5",
                  item.active
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-zinc-400",
                )}
              />
            )}
            <span className="relative z-20">{item.name}</span>
          </a>
        );
      })}
    </div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px)" : "blur(8px)",
        boxShadow: visible
          ? "0 0 24px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : "none",
        width: visible ? "95%" : "100%",
        y: visible ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 30,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 py-2.5 transition-colors lg:hidden",
        visible && "bg-white/95 dark:bg-zinc-950/95 shadow-lg",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "mt-3 flex w-full flex-col items-stretch gap-3 border-t border-zinc-200 dark:border-zinc-800/80 pt-4",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Toggle mobile menu"
    >
      {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </button>
  );
};
