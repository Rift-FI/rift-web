import { useState, useEffect } from "react";
import { Settings, Zap } from "lucide-react";
import { motion } from "motion/react";

interface AdvancedModeToggleProps {
  isAdvanced: boolean;
  onToggle: (advanced: boolean) => void;
  className?: string;
}

export default function AdvancedModeToggle({
  isAdvanced,
  onToggle,
  className = "",
}: AdvancedModeToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onToggle(!isAdvanced)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          isAdvanced
            ? "bg-accent-primary text-white shadow-md"
            : "bg-surface-subtle text-text-subtle hover:bg-surface-alt border border-surface"
        }`}
      >
        <motion.div
          animate={{ rotate: isAdvanced ? 360 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isAdvanced ? (
            <Zap className="w-4 h-4" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
        </motion.div>
        <span>{isAdvanced ? "Advanced" : "Simple"}</span>
      </button>
    </div>
  );
}

// Hook to manage advanced mode state with localStorage persistence
export function useAdvancedMode() {
  const [isAdvanced, setIsAdvanced] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("rift-advanced-mode");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("rift-advanced-mode", isAdvanced.toString());
  }, [isAdvanced]);

  return { isAdvanced, setIsAdvanced };
}