import { motion } from "motion/react";

interface RiftLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function RiftLoader({ message = "Loading...", size = "md" }: RiftLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const containerClasses = {
    sm: "flex flex-col items-center justify-center gap-1",
    md: "flex flex-col items-center justify-center gap-4 py-8",
    lg: "flex flex-col items-center justify-center gap-4 py-8",
  };

  return (
    <div className={containerClasses[size]}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        <img
          src="/rift.png"
          alt="Rift"
          className="w-full h-full object-contain"
        />
      </motion.div>
      {message && (
        <p className="text-text-subtle text-sm font-medium">{message}</p>
      )}
    </div>
  );
}
