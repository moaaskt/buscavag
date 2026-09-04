'use client';

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ProcessedJob } from "@/types/job";
import { JobCard } from "@/components/JobCard";

export const JobListHoverEffect = ({
  jobs,
  onSelect,
  className,
}: {
  jobs: ProcessedJob[];
  onSelect: (job: ProcessedJob) => void;
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("flex flex-col gap-2 relative", className)}>
      {jobs.map((job, idx) => (
        <div
          key={job.id}
          className="relative group block p-0.5 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-zinc-200/80 dark:bg-zinc-800/80 block rounded-xl -z-0"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.1 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 w-full">
            <JobCard job={job} onSelect={onSelect} />
          </div>
        </div>
      ))}
    </div>
  );
};
