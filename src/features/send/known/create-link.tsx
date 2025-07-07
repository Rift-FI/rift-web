import { ReactNode, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { Controller, useForm } from "react-hook-form";
import { Copy } from "lucide-react";
import { z } from "zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { shortenString } from "@/lib/utils";
import { useDisclosure } from "@/hooks/use-disclosure";
import { zodResolver } from "@hookform/resolvers/zod";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import { RadioGroup } from "@/components/ui/radio-group";
import { usePlatformDetection } from "@/utils/platform";
import { analyticsLog } from "@/analytics/events";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";
import { useFlow } from "./flow-context";

const durationSchema = z.object({
  duration: z.enum(["30m", "1h", "2h"]),
  copied: z.enum(["copied", "not-copied"]),
  url: z.string(),
});

type DURATION_SCHEMA = z.infer<typeof durationSchema>;

interface CreatePaymentLinkProps {
  renderPaymentLink: () => ReactNode;
}

export default function CreateLink(props: CreatePaymentLinkProps) {
  const { renderPaymentLink } = props;
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { state, closeAndReset } = useFlow();
  const { telegramUser } = usePlatformDetection();

  const form = useForm<DURATION_SCHEMA>({
    resolver: zodResolver(durationSchema),
    defaultValues: {
      duration: "30m",
      copied: "not-copied",
      url: "",
    },
  });

  const { createPaymentLinkMutation } = usePaymentLinks();

  const stored = state?.getValues() ?? null;
  const RECIPIENT = state?.getValues("recipient");
  const COPIED = form.watch("copied") == "copied";
  const DURATION = form.watch("duration");
  const URL = form.watch("url");

  const handleCopy = () => {
    if (URL) {
      window.navigator.clipboard.writeText(URL);

      // Track copy action for analytics
      const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
      analyticsLog("COPY_REFFERAL", { telegram_id: telegramId });

      form.setValue("copied", "copied");
      setTimeout(() => {
        form.setValue("copied", "not-copied");
      }, 1_000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const contactType = state?.getValues("contactType");
      const recipient = state?.getValues("recipient");

      // Prepare the request body based on contact type
      const requestBody: {
        chain: string;
        duration: string;
        token: string;
        amount: string;
        type: "specific" | "open";
        phoneNumber?: string;
        email?: string;
        externalId?: string;
      } = {
        chain: stored?.chain || "",
        duration: DURATION,
        token: stored?.token || "",
        amount: stored?.amount ?? "0",
        type: recipient == "anonymous" ? "open" : "specific",
      };

      // Add the appropriate identifier based on contact type for specific sends
      if (recipient !== "anonymous") {
        switch (contactType) {
          case "email":
            requestBody.email = recipient;
            break;
          case "externalId":
            requestBody.externalId = recipient;
            break;
          case "phone":
          case "telegram":
          default:
            requestBody.phoneNumber = recipient;
            break;
        }
      }

      createPaymentLinkMutation.mutate(requestBody, {
        onSuccess(data) {
          form.setValue("url", data.link);
          
          // Track payment link creation analytics
          const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
          analyticsLog("PAYMENT_LINK_CREATED", { telegram_id: telegramId });
        },
      });
    }
  }, [isOpen, DURATION]);

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
      <DrawerTrigger className="w-full">{renderPaymentLink()}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="hidden">Create Link</DrawerTitle>
          <DrawerDescription className="hidden">
            Create a crypto collection link
          </DrawerDescription>
        </DrawerHeader>
        <div className="w-full flex flex-col items-center p-5 h-[30vh] gap-4 justify-between">
          <div className="flex flex-col items-center w-full gap-4">
            <div className="flex">
              {/* TODO: For cases where a telegram id was specified, I should probably default to using that instead */}
              <p>
                This link is claimable by{" "}
                <span className="font-semibold text-accent-secondary">
                  {RECIPIENT == "anonymous"
                    ? "anyone"
                    : shortenString(stored?.recipient ?? "")}{" "}
                </span>
              </p>
            </div>

            <Controller
              control={form.control}
              name="duration"
              render={({ field }) => {
                return (
                  <div className="flex flex-row items-center">
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue="30m"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <RadioGroupPrimitive.Item
                          value="30m"
                          className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary "
                        >
                          <p className="font-semibold">30 mins</p>
                        </RadioGroupPrimitive.Item>

                        <RadioGroupPrimitive.Item
                          value="1h"
                          className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary "
                        >
                          <p className="font-semibold">1 hr</p>
                        </RadioGroupPrimitive.Item>

                        <RadioGroupPrimitive.Item
                          value="2h"
                          className="peer flex flex-row items-center bg-muted px-2 py-2 rounded-md cursor-pointer data-[state=checked]:ring data-[state=checked]:ring-accent-secondary "
                        >
                          <p className="font-semibold">2 hrs</p>
                        </RadioGroupPrimitive.Item>
                      </div>
                    </RadioGroup>
                  </div>
                );
              }}
            />

            <div className="flex flex-col items-center w-full">
              <Controller
                control={form.control}
                name="url"
                render={({ field }) => {
                  if (createPaymentLinkMutation?.isPending) {
                    return (
                      <div className="flex flex-row items-center py-2 px-2 gap-2 ">
                        <CgSpinner className="text-accent-primary animate-spin" />{" "}
                        <p className="font-semibold text-white">Creating...</p>
                      </div>
                    );
                  }

                  if (!field.value) {
                    return <div></div>;
                  }
                  return (
                    <div
                      onClick={handleCopy}
                      className="flex flex-row items-center bg-black rounded-md overflow-hidden pl-2 max-w-1/2 group active:scale-95"
                    >
                      <p className="text-muted-foreground px-5 text-ellipsis line-clamp-1">
                        {field.value}
                      </p>
                      <div className="px-2 py-2 h-full items-center bg-accent-primary cursor-pointer ">
                        <Copy />
                      </div>
                    </div>
                  );
                }}
              />

              {COPIED && (
                <div className="flex flex-row items-center gap-x-2 ">
                  <Copy className="w-2 h-2 text-success" />{" "}
                  <p className="font-semibold text-sm text-success">Copied!</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <ActionButton
              variant={"secondary"}
              onClick={closeAndReset}
              loading={createPaymentLinkMutation.isPending}
              size={"small"}
            >
              Done
            </ActionButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
