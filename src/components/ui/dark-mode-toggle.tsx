import React from 'react';
import { motion } from 'framer-motion';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { useDarkMode } from '@/hooks/use-dark-mode';

export const DarkModeToggle: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="relative p-2 rounded-lg bg-surface-subtle hover:bg-surface-alt transition-colors duration-200"
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <IoSunnyOutline className="w-5 h-5 text-yellow-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <IoMoonOutline className="w-5 h-5 text-blue-400" />
        </motion.div>
      </div>
    </motion.button>
  );
};