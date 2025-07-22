import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { IoQrCodeOutline } from "react-icons/io5";
import { IoIosLink } from "react-icons/io";
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

export function ReceiveDrawer(props: Props & ReturnType<typeof useDisclosure>) {
  const navigate = useNavigate();
  const { renderTrigger, isOpen, onOpen, onClose } = props;

  const receiveViaAddress = () => {
    onClose();
    navigate("/app/receive/address");
  };

  const receiveViaLink = () => {
    onClose();
    navigate("/app/receive/link");
  };

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={() => {
        onClose();
      }}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>
      <DrawerContent className="h-[40vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Receive/Request Crypto</DrawerTitle>
          <DrawerDescription>
            Use your address to receive crypto or request from others
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto">
          <div className="mx-4 mt-2">
            <span className="font-medium text-lg">Receive</span>
            <br />
            <span className="text-sm">
              Receive funds using your Address or Sphere links
            </span>
          </div>

          <div
            onClick={receiveViaAddress}
            className="w-full mt-4 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
          >
            <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
              <IoQrCodeOutline className="w-6 h-6" />
            </span>

            <p>
              <span className="font-medium">Address</span>
              <br />
              <span className="text-text-default text-sm">
                Receive funds using your wallet address
              </span>
            </p>
          </div>

          <div
            onClick={receiveViaLink}
            className="w-full mt-2 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
          >
            <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
              <IoIosLink className="w-6 h-6" />
            </span>

            <p>
              <span className="font-medium">Link</span>
              <br />
              <span className="text-text-default text-sm">
                Receive funds through a Sphere link
              </span>
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
