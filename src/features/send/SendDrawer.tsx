import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { IoQrCodeOutline } from "react-icons/io5";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Props {
  renderTrigger: () => ReactNode;
}

export function SendDrawer(props: Props & ReturnType<typeof useDisclosure>) {
  const navigate = useNavigate();
  const { renderTrigger, isOpen, onOpen, onClose } = props;

  const sendToAddress = () => {
    onClose();
    navigate("/app/send/address");
  };

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>
      <DrawerContent className="h-[30vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Base USDC</DrawerTitle>
          <DrawerDescription>
            Send Base USDC to another wallet address
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto">
          <div className="mx-4 mt-2">
            <span className="font-medium text-lg">Send Base USDC</span>
            <br />
            <span className="text-sm">
              Send Base USDC to another wallet address
            </span>
          </div>

          <div
            onClick={sendToAddress}
            className="w-full mt-4 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
          >
            <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
              <IoQrCodeOutline className="w-6 h-6" />
            </span>

            <p>
              <span className="font-medium">Send to Address</span>
              <br />
              <span className="text-text-default text-sm">
                Enter wallet address to send Base USDC
              </span>
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}