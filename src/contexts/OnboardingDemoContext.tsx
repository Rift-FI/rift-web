import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { IoChevronForward, IoChevronBack } from "react-icons/io5";

// Demo steps configuration with target element IDs and required routes
const DEMO_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Rift! 👋",
    description:
      "Your global USD account for payments, transfers & wealth building. Let me show you around!",
    targetId: null,
    route: "/app",
  },
  {
    id: "balance",
    title: "Your Balance 💰",
    description:
      "This shows your total balance in your local currency. Tap the eye icon to hide it for privacy.",
    targetId: "balance-section",
    route: "/app",
  },
  {
    id: "topup",
    title: "Top Up ➕",
    description:
      "Tap here to add money via mobile money, bank transfer, or card payment.",
    targetId: "topup-button",
    route: "/app",
  },
  {
    id: "history",
    title: "Your Transactions 📜",
    description:
      "All your deposits, withdrawals, and transfers appear here. Swipe between tabs to see different types.",
    targetId: "history-section",
    route: "/app",
  },
  {
    id: "earn",
    title: "Earn Tab ✨",
    description:
      "Invest your money and earn monthly dividends from real businesses!",
    targetId: "tab-earn",
    route: "/app/invest",
  },
  {
    id: "settings",
    title: "Settings ⚙️",
    description:
      "Manage your profile, withdrawal accounts, notifications, and security settings here.",
    targetId: "tab-settings",
    route: "/app/profile",
  },
  {
    id: "complete",
    title: "You're Ready! 🎉",
    description:
      "That's it! Start exploring. You can replay this tutorial anytime from Settings → App Tutorial.",
    targetId: null,
    route: "/app",
  },
];

interface OnboardingDemoContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: (typeof DEMO_STEPS)[0] | null;
  startDemo: () => void;
  endDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipDemo: () => void;
  hasCompletedDemo: boolean;
  checkAndStartDemo: () => void;
}

const OnboardingDemoContext = createContext<OnboardingDemoContextType | null>(
  null
);

export function useOnboardingDemo() {
  const context = useContext(OnboardingDemoContext);
  if (!context) {
    throw new Error(
      "useOnboardingDemo must be used within OnboardingDemoProvider"
    );
  }
  return context;
}

interface OnboardingDemoProviderProps {
  children: ReactNode;
}

export function OnboardingDemoProvider({
  children,
}: OnboardingDemoProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedDemo, setHasCompletedDemo] = useState(() => {
    return localStorage.getItem("demo_completed") === "true";
  });

  const startDemo = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endDemo = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompletedDemo(true);
    localStorage.setItem("demo_completed", "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endDemo();
    }
  }, [currentStep, endDemo]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipDemo = useCallback(() => {
    endDemo();
  }, [endDemo]);

  // Function to check and auto-start demo for new users
  const checkAndStartDemo = useCallback(() => {
    const completed = localStorage.getItem("demo_completed");
    if (completed !== "true") {
      // Small delay to let UI render
      setTimeout(() => {
        startDemo();
      }, 800);
    }
  }, [startDemo]);

  const currentStepData = isActive ? DEMO_STEPS[currentStep] : null;

  return (
    <OnboardingDemoContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: DEMO_STEPS.length,
        currentStepData,
        startDemo,
        endDemo,
        nextStep,
        prevStep,
        skipDemo,
        hasCompletedDemo,
        checkAndStartDemo,
      }}
    >
      {children}
      {isActive && currentStepData && (
        <DemoOverlay
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={DEMO_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipDemo}
        />
      )}
    </OnboardingDemoContext.Provider>
  );
}

interface DemoOverlayProps {
  step: (typeof DEMO_STEPS)[0];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TooltipPos {
  top: number;
  left: number;
  arrowPosition: "top" | "bottom";
  arrowLeft: number;
}

function DemoOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: DemoOverlayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ 
    top: 0, 
    left: 0, 
    arrowPosition: "bottom",
    arrowLeft: 50 
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const hasTarget = step.targetId !== null;

  // Navigate to correct route if needed
  useEffect(() => {
    if (step.route && location.pathname !== step.route) {
      setIsNavigating(true);
      navigate(step.route);
      // Wait for navigation to complete
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsNavigating(false);
    }
  }, [step.route, location.pathname, navigate]);

  // Find and track target element
  useEffect(() => {
    if (!step.targetId || isNavigating) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.getElementById(step.targetId!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll into view if needed
        const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isInView) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };

    // Initial position with delay for DOM to settle
    const initialTimer = setTimeout(updatePosition, 100);

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    // Poll for position changes (for dynamic content)
    const interval = setInterval(updatePosition, 200);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      clearInterval(interval);
    };
  }, [step.targetId, currentStep, isNavigating]);

  // Calculate tooltip position
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipHeight = tooltip.offsetHeight;
    const tooltipWidth = tooltip.offsetWidth;
    const padding = 16;
    const arrowGap = 12;

    if (!targetRect) {
      // Center on screen for steps without target
      setTooltipPos({
        top: (window.innerHeight - tooltipHeight) / 2,
        left: (window.innerWidth - tooltipWidth) / 2,
        arrowPosition: "bottom",
        arrowLeft: 50,
      });
      return;
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;

    let top = 0;
    let left = 0;
    let arrowPosition: "top" | "bottom" = "top";

    // Try to position below target first
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= tooltipHeight + arrowGap + padding) {
      // Position below
      top = targetRect.bottom + arrowGap;
      arrowPosition = "top";
    } else if (spaceAbove >= tooltipHeight + arrowGap + padding) {
      // Position above
      top = targetRect.top - tooltipHeight - arrowGap;
      arrowPosition = "bottom";
    } else {
      // Position in center
      top = Math.max(padding, (window.innerHeight - tooltipHeight) / 2);
      arrowPosition = "bottom";
    }

    // Horizontal centering with bounds
    left = targetCenterX - tooltipWidth / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    // Calculate arrow position relative to tooltip
    const arrowLeft = ((targetCenterX - left) / tooltipWidth) * 100;
    const clampedArrowLeft = Math.max(10, Math.min(90, arrowLeft));

    setTooltipPos({ top, left, arrowPosition, arrowLeft: clampedArrowLeft });
  }, [targetRect]);

  // Don't render while navigating
  if (isNavigating) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>,
      document.body
    );
  }

  // Render portal
  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with cutout for target */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "auto" }}>
        <defs>
          <mask id="spotlight">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#spotlight)"
          onClick={onSkip}
        />
      </svg>

      {/* Pulsing highlight ring around target */}
      {targetRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          <div className="w-full h-full rounded-xl border-2 border-accent-primary" />
          <div 
            className="absolute inset-0 rounded-xl border-2 border-accent-primary/50 animate-ping"
            style={{ animationDuration: "1.5s" }}
          />
        </div>
      )}

      {/* Tooltip card */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-visible"
        style={{
          top: tooltipPos.top,
          left: Math.max(16, Math.min(tooltipPos.left, window.innerWidth - 320 - 16)),
          pointerEvents: "auto",
        }}
      >
        {/* Arrow pointing to target */}
        {targetRect && (
          <div
            className="absolute w-4 h-4 bg-white dark:bg-gray-900 rotate-45 -z-10"
            style={{
              [tooltipPos.arrowPosition]: -8,
              left: `${tooltipPos.arrowLeft}%`,
              transform: `translateX(-50%) rotate(45deg)`,
            }}
          />
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-6 bg-accent-primary"
                  : idx < currentStep
                  ? "w-1.5 bg-accent-primary/60"
                  : "w-1.5 bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
            {step.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                <IoChevronBack className="w-4 h-4" />
                Back
              </button>
            )}

            <button
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-accent-primary rounded-2xl text-white text-sm font-medium hover:bg-accent-secondary transition-colors active:scale-95"
            >
              {isLastStep ? "Get Started!" : "Next"}
              {!isLastStep && <IoChevronForward className="w-4 h-4" />}
            </button>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <button
              onClick={onSkip}
              className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default OnboardingDemoProvider;
