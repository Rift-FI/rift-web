import { ReactNode } from "react";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Copy } from "lucide-react";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";

interface sendRequestLinkProps {
  renderSendReqLink: () => ReactNode;
  requestLink: string;
}

export default function SendRequestLink({
  renderSendReqLink,
  requestLink,
}: sendRequestLinkProps) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const handleCopy = () => {
    window.navigator.clipboard.writeText(requestLink);
    toast.success("Link copied to clipboard");
  };

  return (
    <Drawer
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
      <DrawerTrigger asChild>{renderSendReqLink()}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Link</DrawerTitle>
          <DrawerDescription>Send your crypto request link</DrawerDescription>
        </DrawerHeader>

        <div className="w-full flex flex-col items-center p-5 h-[30vh] gap-4 justify-between">
          <p className="text-center font-semibold">
            Your crypto request link was created successfully <br />{" "}
            <span className="text-md font-light">
              Copy & share it to receive crypto in your wallet
            </span>{" "}
          </p>

          <div
            onClick={handleCopy}
            className="flex flex-row items-center bg-black rounded-md overflow-hidden pl-2 max-w-1/2 group active:scale-95"
          >
            <p className="text-muted-foreground px-5 text-ellipsis line-clamp-1">
              {requestLink}
            </p>
            <div className="px-2 py-2 h-full items-center bg-accent-primary cursor-pointer ">
              <Copy />
            </div>
          </div>

          <ActionButton onClick={onClose}>Close</ActionButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
