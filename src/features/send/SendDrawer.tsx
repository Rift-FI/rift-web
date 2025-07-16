import { ReactNode } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { IoQrCodeOutline } from "react-icons/io5";
import { LiaUserSolid } from "react-icons/lia";
import { TbUserOff } from "react-icons/tb";
import { FiArrowLeft } from "react-icons/fi";
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
import { Button } from "@/components/ui/button";

interface Props {
  renderTrigger: () => ReactNode;
}

const send_links_schema = z.object({
  send_type: z.enum(["ADDRESS", "LINK"]),
});

type SEND_LINKS_SCHEMA_TYPE = z.infer<typeof send_links_schema>;

export function SendDrawer(props: Props & ReturnType<typeof useDisclosure>) {
  const navigate = useNavigate();
  const { renderTrigger, isOpen, onOpen, onClose } = props;

  const send_links_form = useForm<SEND_LINKS_SCHEMA_TYPE>({
    resolver: zodResolver(send_links_schema),
    defaultValues: {
      send_type: "ADDRESS",
    },
  });
  const SEND_TYPE = send_links_form.watch("send_type");

  const sendToaddress = () => {
    onClose();
    navigate("/app/send/address");
  };

  const sendViaLink = () => {
    onClose();
    navigate("/app/receive/link");
  };

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={() => {
        onClose();
        send_links_form.reset();
      }}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
          send_links_form.reset();
        }
      }}
    >
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>
      <DrawerContent className="h-[40vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Crypto</DrawerTitle>
          <DrawerDescription>
            Send crypto to an address or create a Sphere link
          </DrawerDescription>
        </DrawerHeader>

        {SEND_TYPE == "ADDRESS" ? (
          <motion.div
            key={send_links_form.getValues("send_type")}
            initial={{ x: -6, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-y-auto"
          >
            <div className="mx-4 mt-2">
              <span className="font-bold text-lg">Send</span>
              <br />
              <span className="text-sm">
                Send crypto to an address or through a Sphere link
              </span>
            </div>

            <div
              onClick={sendToaddress}
              className="w-full mt-4 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
            >
              <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
                <IoQrCodeOutline className="w-6 h-6" />
              </span>

              <p>
                <span className="font-semibold">Address</span>
                <br />
                <span className="text-text-default text-sm">
                  Send crypto to another wallet address
                </span>
              </p>
            </div>

            <div
              onClick={() => send_links_form.setValue("send_type", "LINK")}
              className="w-full mt-2 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
            >
              <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
                <IoIosLink className="w-6 h-6" />
              </span>

              <p>
                <span className="font-semibold">Link</span>
                <br />
                <span className="text-text-default text-sm">
                  Send through a Sphere link
                </span>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={send_links_form.getValues("send_type")}
            initial={{ x: 6, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-y-auto mt-2"
          >
            <div className="w-full pb-2 z-10 border-b-2 border-surface">
              <Button
                onClick={() => send_links_form.setValue("send_type", "ADDRESS")}
                variant="ghost"
                className="w-9 h-9 ml-2 rounded-full cursor-pointer bg-secondary"
              >
                <FiArrowLeft className="text-4xl" />
              </Button>

              <span className="absolute left-1/2 -translate-x-1/2 transform font-bold text-lg capitalize align-middle text-center">
                Sphere Link
              </span>
            </div>

            <div className="w-full mt-1 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer">
              <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
                <LiaUserSolid className="w-6 h-6" />
              </span>

              <p>
                <span className="font-semibold">Specific User Link</span>
                <br />
                <span className="text-text-default text-sm">
                  Create a link only a specific user can use
                </span>
              </p>
            </div>

            <div className="w-full mt-1 border-b-2 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer">
              <span className="w-12 h-12 bg-surface-subtle flex flex-row items-center justify-center rounded-md">
                <TbUserOff className="w-6 h-6" />
              </span>

              <p>
                <span className="font-semibold">Open Link</span>
                <br />
                <span className="text-text-default text-sm">
                  Create a link that anyone can use
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
