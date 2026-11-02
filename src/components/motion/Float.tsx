"use client";

import { motion } from "motion/react";

export default function Float({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}
