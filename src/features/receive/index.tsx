import { ReactNode, useCallback } from "react";
import { ReceiveCryptoProvider, useReceiveCrypto } from "./context";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import MyAddress from "./components/MyAddress";
import RequestToken from "./components/RequestToken";
import RequestAmount from "./components/RequestAmount";

interface Props {
  renderTrigger: () => ReactNode
}

function ReceiveCryptoContainer(props: Props & ReturnType<typeof useDisclosure>) {
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const { currentStep, state } = useReceiveCrypto();

  const renderCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 'MY-ADDRESS': {
        return <MyAddress />
      }
      case 'TOKEN-SELECT': {
        return <RequestToken />
      }
      case 'TOKEN-AMOUNT': {
        return <RequestAmount />
      }
      default: {
        return <div></div>
      }
    }
  }, [currentStep])

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
      }}>
      <DrawerTrigger asChild>
        {renderTrigger()}
      </DrawerTrigger>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Receive/Request Crypto</DrawerTitle>
          <DrawerDescription className="hidden">Use your address to receive crypto or request from others</DrawerDescription>
        </DrawerHeader>
        <div className="w-full h-full p-4 overflow-y-auto">
          {renderCurrentStep()}
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
  )
}
