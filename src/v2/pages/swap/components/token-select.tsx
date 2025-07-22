import { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import TokenSearch from "./token-search";
import FromTokenSelect from "./from-token-select";
import { useSwap } from "../swap-context";

interface TokenSelectProps {
  renderTrigger: () => ReactNode;
  position: "to" | "from";
}

export default function TokenSelect(props: TokenSelectProps) {
  const { renderTrigger, position } = props;
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { state } = useSwap();

  const handleSelect = (args: { chain: string; token: string }) => {
    state.setValue(position == "from" ? "from_token" : "to_token", args.token);

    state.setValue(position == "from" ? "from_chain" : "to_chain", args.chain);

    console.log("triggering close::");
    onClose();
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
      <DrawerTrigger>
        <>{renderTrigger()}</>
      </DrawerTrigger>
      <DrawerContent className="h-[70vh] min-h-[70vh] max-h-[70vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Choose token</DrawerTitle>
          <DrawerDescription>Choose a token to swap</DrawerDescription>
        </DrawerHeader>
        <div className="w-full h-full overflow-y-auto">
          {position == "from" ? (
            <FromTokenSelect onSelect={handleSelect} />
          ) : (
            <TokenSearch onSelect={handleSelect} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
