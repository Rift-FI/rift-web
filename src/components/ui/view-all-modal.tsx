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
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-sm text-text-subtle mt-1">
                {description}
              </DrawerDescription>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-subtle rounded-full transition-colors"
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