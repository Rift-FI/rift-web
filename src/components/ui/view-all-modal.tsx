import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useDesktopDetection from "@/hooks/use-desktop-detection";

interface ViewAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  renderTrigger?: () => ReactNode;
}

export default function ViewAllModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  renderTrigger,
}: ViewAllModalProps) {
  const isDesktop = useDesktopDetection();

  if (isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-[#0b1214]/45 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-lg border border-border shadow-modal w-full max-w-4xl max-h-[85vh] flex flex-col">
                <div className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="text-[17px] font-semibold text-text-default">{title}</h2>
                    {description && (
                      <p className="text-[13px] text-text-muted mt-0.5 tabular-nums">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="p-2 hover:bg-surface-subtle rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {renderTrigger && <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>}
      
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-surface pb-4">
          <div>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="mt-0.5 tabular-nums">
                {description}
              </DrawerDescription>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-surface-subtle rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}