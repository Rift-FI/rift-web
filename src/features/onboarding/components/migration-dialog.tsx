import ActionButton from "@/components/ui/action-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { usePlatformDetection } from "@/utils/platform";
import { AlertTriangle, Smartphone, Users } from "lucide-react";

interface MigrationDialogProps {
  isOpen: boolean;
  onRecoverV1: () => void;
  onCreateNew: () => void;
}

export default function MigrationDialog({
  isOpen,
  onRecoverV1,
  onCreateNew,
}: MigrationDialogProps) {
  const { isTelegram, isBrowser } = usePlatformDetection();

  return (
    <Drawer open={isOpen} onOpenChange={() => {}}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={24} />
            Account Migration Required
          </DrawerTitle>
          <DrawerDescription>
            We've upgraded Sphere! Choose how to proceed with your account.
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full px-5 pb-5 gap-4 flex flex-col">
          {/* Warning message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">
                  Important Notice
                </p>
                <p className="text-yellow-700 text-sm">
                  If you had a wallet in Sphere v1 and choose to create a new
                  account, you will <strong>lose access to any funds</strong>{" "}
                  stored in your previous wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Recovery option for Telegram users */}
          {isTelegram && (
            <div
              onClick={onRecoverV1}
              className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border-2 border-green-200 bg-green-50"
            >
              <Users className="text-green-600" size={24} />
              <div className="flex flex-col items-start">
                <p className="font-semibold text-green-800">
                  Recover Version 1 Account
                </p>
                <p className="text-sm text-green-700">
                  Access your existing wallet and funds from Sphere v1
                </p>
              </div>
            </div>
          )}

          {/* Browser users info */}
          {isBrowser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-blue-800 mb-1">
                    To Recover Version 1 Account
                  </p>
                  <p className="text-blue-700 text-sm mb-2">
                    Please open Sphere in Telegram where your Telegram ID will
                    be used as your username for account recovery.
                  </p>
                  <a
                    href="https://t.me/sphere_id_bot/sphere"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm hover:text-blue-800 transition-colors"
                  >
                    Open Sphere in Telegram →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Create new option */}
          <div
            onClick={onCreateNew}
            className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
          >
            <div className="w-6 h-6 rounded-full bg-accent-secondary flex items-center justify-center">
              <span className="text-white text-sm font-bold">+</span>
            </div>
            <div className="flex flex-col items-start">
              <p className="font-semibold">Create or Login to your Account</p>
              <p className="text-sm text-muted-foreground">
                Start fresh with a new wallet (you'll lose access to v1 funds)
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
