import { ReactNode, useCallback } from "react";
import { ReceiveCryptoProvider, useReceiveCrypto } from "./context";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import MyAddress from "./components/MyAddress";
import RequestToken from "./components/RequestToken";
import RequestAmount from "./components/RequestAmount";
import { cn } from "@/lib/utils";

interface Props {
  renderTrigger: () => ReactNode;
}

function ReceiveCryptoContainer(
  props: Props & ReturnType<typeof useDisclosure>
) {
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const { mode, requestStep, switchMode, state } = useReceiveCrypto();

  const renderRequestContent = useCallback(() => {
    switch (requestStep) {
      case "token-select": {
        return <RequestToken />;
      }
      case "amount-input": {
        return <RequestAmount />;
      }
      default: {
        return <RequestToken />;
      }
    }
  }, [requestStep]);

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={() => {
        onClose();
        state?.reset();
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
      <DrawerContent className="min-h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Receive/Request Crypto</DrawerTitle>
          <DrawerDescription className="hidden">
            Use your address to receive crypto or request from others
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full h-full overflow-y-auto">
          {/* Tab Navigation */}
          <div className="sticky bottom-0 bg-app-background border-b border-border z-10">
            <div className="flex items-center justify-center p-4">
              <div className="flex bg-muted/30 rounded-lg p-1 w-full max-w-md">
                <button
                  onClick={() => switchMode("receive")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                    mode === "receive"
                      ? "bg-white text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Receive
                </button>
                <button
                  onClick={() => switchMode("request")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                    mode === "request"
                      ? "bg-white text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Request funds
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === "receive" ? <MyAddress /> : renderRequestContent()}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function ReceiveCrypto(props: Props) {
  const disclosure = useDisclosure();

  return (
    <ReceiveCryptoProvider onClose={disclosure.onClose}>
      <ReceiveCryptoContainer {...props} {...disclosure} />
    </ReceiveCryptoProvider>
  );
}
