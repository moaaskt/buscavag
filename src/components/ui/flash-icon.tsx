"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashIconProps extends React.SVGProps<SVGSVGElement> {
  loading?: boolean;
}

export function FlashIcon({ loading, className, ...props }: FlashIconProps) {
  // Using the path from flash-outline.svg
  const flashPath = "M11.11 23a1 1 0 0 1-.34-.06 1 1 0 0 1-.65-1.05l.77-7.09H5a1 1 0 0 1-.83-1.56l7.89-11.8a1 1 0 0 1 1.17-.38 1 1 0 0 1 .65 1l-.77 7.14H19a1 1 0 0 1 .83 1.56l-7.89 11.8a1 1 0 0 1-.83.44zM6.87 12.8H12a1 1 0 0 1 .74.33 1 1 0 0 1 .25.78l-.45 4.15 4.59-6.86H12a1 1 0 0 1-1-1.11l.45-4.15z";

  if (!loading) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(className)}
        {...props}
      >
        <path d={flashPath} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <motion.path
        d={flashPath}
        initial={{
          pathLength: 0,
          fill: "rgba(16, 185, 129, 0)", // Emerald 500 with 0 opacity
          opacity: 0,
        }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 1, 1],
          fill: [
            "rgba(16, 185, 129, 0)",
            "rgba(16, 185, 129, 0)",
            "rgba(16, 185, 129, 1)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
