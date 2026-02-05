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
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                <div className="flex flex-row items-center justify-between border-b border-gray-200 p-6">
                  <div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {description && (
                      <p className="text-sm text-text-subtle mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
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
      
      <DrawerContent className="h-[85vh] rounded-t-2xl">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-surface pb-4">
          <div>
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-sm text-text-subtle mt-1">
                {description}
              </DrawerDescription>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-subtle rounded-2xl transition-colors"
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