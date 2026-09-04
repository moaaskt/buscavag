"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export const LoaderThree = ({ size = 20, className, ...props }: LoaderProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

export const LoaderThreeBars = ({ size = 20, className, ...props }: LoaderProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("inline-block", className)}
      {...props}
    >
      <rect x="2" y="6" width="4" height="12" rx="2">
        <animate
          attributeName="height"
          begin="0s"
          dur="0.8s"
          values="12;20;12"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          begin="0s"
          dur="0.8s"
          values="6;2;6"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="10" y="6" width="4" height="12" rx="2">
        <animate
          attributeName="height"
          begin="0.15s"
          dur="0.8s"
          values="12;20;12"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          begin="0.15s"
          dur="0.8s"
          values="6;2;6"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="18" y="6" width="4" height="12" rx="2">
        <animate
          attributeName="height"
          begin="0.3s"
          dur="0.8s"
          values="12;20;12"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          begin="0.3s"
          dur="0.8s"
          values="6;2;6"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
};
