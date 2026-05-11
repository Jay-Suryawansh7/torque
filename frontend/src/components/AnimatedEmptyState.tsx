import { motion } from "motion/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function AnimatedEmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-4 opacity-40"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      {action && <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{action}</motion.div>}
    </motion.div>
  );
}
