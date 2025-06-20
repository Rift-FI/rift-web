import { useCallback } from "react";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import RequestLinkHandler from "./components/RequestLinkHandler";
import CollectLinkHandler from "./components/CollectLinkHandler";

interface Props {
  redirectType: "RECEIVE-FROM-COLLECT-LINK" | "SEND-TO-REQUEST-LINK";
}

export default function RedirectLinks(
  props: Props & Partial<ReturnType<typeof useDisclosure>>
) {
  const { isOpen, onOpen, onClose } = props;

  const onDismissDrawer = useCallback(() => {
    console.log("closing drawer");
    // Clean up localStorage first
    localStorage.removeItem("collectobject");
    localStorage.removeItem("requestobject");
    // Then close the drawer
    onClose?.();
  }, [onClose]);

  const renderRedirectLinkHandler = useCallback(() => {
    switch (props.redirectType) {
      case "RECEIVE-FROM-COLLECT-LINK": {
        return <CollectLinkHandler onDismissDrawer={onDismissDrawer} />;
      }
      case "SEND-TO-REQUEST-LINK": {
        return <RequestLinkHandler onDismissDrawer={onDismissDrawer} />;
      }
      default: {
        return <></>;
      }
    }
  }, [props.redirectType, onDismissDrawer]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          onOpen?.();
        } else {
          onDismissDrawer();
        }
      }}
      dismissible={true}
      shouldScaleBackground={true}
    >
      <DrawerContent className="min-h-[45vh] max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Sphere Links</DrawerTitle>
          <DrawerDescription className="hidden">
            Send or Request funds with a Sphere link
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full h-full p-4 overflow-y-auto">
          {renderRedirectLinkHandler()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
