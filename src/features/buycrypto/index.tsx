import { ReactNode, useCallback } from "react";
import { BuyCryptoProvider, useBuyCrypto } from "./context";
import { useDisclosure } from "@/hooks/use-disclosure";
import StepsPicker from "./components/StepsPicker";
import CryptoAmount from "./components/CryptoAmount";
import PhoneInput from "./components/PhoneInput";
import Confirmation from "./components/Confirmation";
import CryptoPicker from "./components/TokenPicker";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

interface Props {
  renderTrigger: () => ReactNode
}

function BuyCryptoContainer(props: Props & ReturnType<typeof useDisclosure>) {
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const { currentStep, state } = useBuyCrypto();

  const renderCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 'CHOOSE-TOKEN': {
        return <CryptoPicker />
      }
      case 'CRYPTO-AMOUNT': {
        return <CryptoAmount />
      }
      case "PHONE": {
        return <PhoneInput />
      }
      case 'CONFIRM': {
        return <Confirmation />
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
      <DrawerHeader>
        <DrawerTitle className="hidden">Buy Crypto</DrawerTitle>
        <DrawerDescription className="hidden">Buy Crypto with cash via M-pesa</DrawerDescription>
      </DrawerHeader>
      <DrawerContent className="h-[95vh]">
        <div className="w-full h-full p-4">
          {renderCurrentStep()}
          <StepsPicker />
        </div>

      </DrawerContent>
    </Drawer>
  );
}

export default function BuyCrypto(props: Props) {
  const disclosure = useDisclosure();

  return (
    <BuyCryptoProvider onClose={disclosure.onClose}>
      <BuyCryptoContainer {...props} {...disclosure} />
    </BuyCryptoProvider>
  )
}