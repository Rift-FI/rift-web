import { useState } from "react";
import { motion } from "motion/react";
import { FiZap, FiZapOff } from "react-icons/fi";

interface InstantWithdrawalsToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  hasPaymentAccount?: boolean;
}

export default function InstantWithdrawalsToggle({
  enabled,
  onToggle,
  disabled = false,
  hasPaymentAccount = false,
}: InstantWithdrawalsToggleProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (disabled || isToggling) return;
    
    if (!hasPaymentAccount && !enabled) {
      // Can't enable without payment account
      return;
    }

    setIsToggling(true);
    try {
      await onToggle(!enabled);
    } finally {
      setIsToggling(false);
    }
  };

  const canEnable = hasPaymentAccount || enabled;

  return (
    <div className="bg-surface-subtle rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            enabled ? 'bg-accent-primary/10' : 'bg-gray-500/10'
          }`}>
            {enabled ? (
              <FiZap className="w-5 h-5 text-accent-primary" />
            ) : (
              <FiZapOff className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="font-medium">Instant Withdrawals</h3>
            <p className="text-sm text-text-subtle">
              {enabled 
                ? "Funds are instantly sent to your withdrawal account"
                : "Manual withdrawal process"
              }
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={disabled || isToggling || (!canEnable && !enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            enabled 
              ? 'bg-accent-primary' 
              : canEnable 
                ? 'bg-gray-300 dark:bg-gray-600' 
                : 'bg-gray-200 dark:bg-gray-700'
          } ${
            disabled || isToggling || (!canEnable && !enabled)
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${
              enabled ? 'bg-white' : 'bg-white'
            }`}
          />
        </button>
      </div>

      {/* Warning/Info Messages */}
      {!hasPaymentAccount && !enabled && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ Setup a withdrawal account first to enable instant withdrawals
          </p>
        </div>
      )}

      {enabled && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ Funds will be automatically sent to your withdrawal account when received
          </p>
        </div>
      )}

      {isToggling && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔄 Updating instant withdrawals setting...
          </p>
        </div>
      )}
    </div>
  );
}