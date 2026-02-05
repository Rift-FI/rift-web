import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import { useDisclosure } from "@/hooks/use-disclosure";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Props {
  renderTrigger: () => ReactNode;
  /** Optional function to check before opening (e.g., KYC check). Return false to prevent opening. */
  beforeOpen?: () => boolean;
}

export function SendDrawer(props: Props & ReturnType<typeof useDisclosure>) {
  const navigate = useNavigate();
  const { renderTrigger, isOpen, onOpen, onClose, beforeOpen } = props;
  const isDesktop = useDesktopDetection();

  const handleOpen = () => {
    // Check beforeOpen guard (e.g., KYC check)
    if (beforeOpen && !beforeOpen()) {
      return;
    }
    onOpen();
  };

  const sendToAddress = () => {
    onClose();
    navigate("/app/send/address");
  };

  return (
    <>
      {/* Manual trigger with beforeOpen check - uses contents to not affect layout */}
      <div onClick={handleOpen} className="contents">
        {renderTrigger()}
      </div>

      <Drawer
        modal
        open={isOpen}
        onClose={onClose}
        onOpenChange={(open) => {
          if (open) {
            // Only open through handleOpen
          } else {
            onClose();
          }
        }}
      >
        <DrawerContent className={isDesktop ? "max-w-md" : "h-[30vh]"}>
          <DrawerHeader className={isDesktop ? "relative" : "hidden"}>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl font-semibold">Send Base USDC</DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600 mt-1">
                  Send Base USDC to another wallet address
                </DrawerDescription>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </DrawerHeader>

          <div className={`overflow-y-auto ${isDesktop ? "p-6" : ""}`}>
            {!isDesktop && (
              <div className="mx-4 mt-2">
                <span className="font-medium text-lg">Send Base USDC</span>
                <br />
                <span className="text-sm">
                  Send Base USDC to another wallet address
                </span>
              </div>
            )}

            <div
              onClick={sendToAddress}
              className={`w-full ${isDesktop ? "p-4" : "mt-4 p-2 px-3"} border border-gray-200 rounded-xl flex flex-row items-center justify-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <span className={`${isDesktop ? "w-14 h-14" : "w-12 h-12"} bg-accent-primary/10 flex flex-row items-center justify-center rounded-xl`}>
                <IoQrCodeOutline className={`${isDesktop ? "w-7 h-7" : "w-6 h-6"} text-accent-primary`} />
              </span>

              <div>
                <p className="font-semibold text-gray-900">Send to Address</p>
                <p className="text-sm text-gray-600">
                  Enter wallet address to send Base USDC
                </p>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
