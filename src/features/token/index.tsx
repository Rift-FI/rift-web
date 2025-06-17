import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import { ReactNode } from "react";
import TokenContextProvider, { useToken } from "./token-context";
import TokenLayout from "./token-layout";
import { ChevronLeft } from "lucide-react";

interface TokenDrawerProps {
  tokenName: string;
  tokenId: string;
  chain: string;
  renderTrigger: () => ReactNode;
}

export default function TokenDrawer(props: TokenDrawerProps) {
  const disclosure = useDisclosure();

  return (
    <TokenContextProvider tokenName={props.tokenName} chain={props.chain} tokenId={props.tokenId} onClose={disclosure.onClose}>
      <_TokenDrawer {...props} {...disclosure} />
    </TokenContextProvider>
  );
}

function _TokenDrawer(
  props: TokenDrawerProps & ReturnType<typeof useDisclosure>
) {
  const { closeAndReset } = useToken();
  const { renderTrigger, isOpen, onOpen, onClose, tokenId } = props;

  const handleBackPress = () => {
    closeAndReset();
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
      <DrawerTrigger asChild>
        <div>{renderTrigger()}</div>
      </DrawerTrigger>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader>
          <div className="flex flex-row items-center justify-between">
            <div
              onClick={handleBackPress}
              className="flex cursor-pointer flex-row items-center gap-x-5"
            >
              <ChevronLeft />
              <DrawerTitle>
                <p>{tokenId.toUpperCase()}</p>
              </DrawerTitle>
            </div>
            <div />
          </div>
        </DrawerHeader>
        <div className="flex flex-col w-full h-full items-center overflow-y-auto">
          <TokenLayout />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
