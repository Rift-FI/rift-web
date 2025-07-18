import { useMemo } from "react";
import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useFlow } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";
import COUNTRY_PHONES from "@/lib/country-phones";

const identifierSchema = z.object({
  country: z.string(),
  phone: z.string(),
});

type IDENTIFIER_SCHEMA = z.infer<typeof identifierSchema>;

interface Props {
  flow?: "onboarding" | "login";
}
export default function Identifier(props: Props) {
  const { flow: flowType } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const flow = useFlow();
  const { sendOTPMutation } = useWalletAuth();

  const stored = flow.stateControl.getValues();

  const form = useForm<IDENTIFIER_SCHEMA>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      country: stored?.identifier?.split("-")?.at(0),
      phone: stored?.identifier?.split("-")?.at(1),
    },
  });

  const COUNTRY = form.watch("country");
  const PHONE_VALUE = form.watch("phone");
  const ENABLE_CONTINUE = PHONE_VALUE?.trim().length > 0;

  const countryDetails = useMemo(() => {
    const country = COUNTRY_PHONES.find((c) => c.code == COUNTRY);
    return country ?? null;
  }, [COUNTRY]);

  const handleSubmit = async (values: IDENTIFIER_SCHEMA) => {
    console.log("Clicked", values);
    let phoneNum = values.phone.startsWith("0")
      ? values.phone.trim().replace("0", "")
      : values.phone.trim();
    phoneNum = values.country?.trim() + "-" + phoneNum;

    flow.stateControl.setValue("identifier", phoneNum);

    try {
      await sendOTPMutation.mutateAsync({
        phoneNumber: phoneNum?.replace("-", ""),
      });

      if (flowType == "login") {
        return flow.goToNext("login-code");
      }
      flow.goToNext();
    } catch (e) {
      console.log("something went wrong::", e);
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleError = (error: any) => {
    console.log("Something went wrong ::", error);
    toast.custom(
      () => <RenderErrorToast message="Fill the input correctly" />,
      {
        duration: 2000,
        position: "top-center",
      }
    );
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <p className="font-semibold text-md">Phone</p>
      <p className="text-sm">Enter your phone number to continue</p>

      <div className="flex flex-row w-full gap-1 mt-4 border-1 border-accent rounded-md">
        <Controller
          control={form.control}
          name="country"
          render={({ field }) => {
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
                  <div className="flex flex-row items-center justify-center gap-1 border-r-1 border-accent px-[0.75rem] py-2 h-full">
                    {countryDetails ? (
                      <div className="flex flex-row gap-x-1">
                        {countryDetails.flag}
                      </div>
                    ) : (
                      <ChevronDown className="text-sm text-text-subtle" />
                    )}
                  </div>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="hidden">
                    <DrawerTitle>Phone</DrawerTitle>
                    <DrawerDescription>Phone contry-code</DrawerDescription>
                  </DrawerHeader>

                  <div className="w-full h-[50vh] p-4 gap-3 overflow-scroll">
                    {COUNTRY_PHONES?.map((country) => {
                      return (
                        <div
                          onClick={() => {
                            field.onChange(country.code);
                            onClose();
                          }}
                          key={country.code}
                          className="w-full flex flex-row items-center justify-between gap-x-2 py-3 cursor-pointer"
                        >
                          <p className="text-sm">{country.countryname}</p>
                          <div className="flex flex-row items-center gap-x-2 w-[15%]">
                            <p>{country.flag}</p>
                            <p className="text-sm font-semibold">
                              {country.code}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DrawerContent>
              </Drawer>
            );
          }}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => {
            return (
              <input
                type="tel"
                className="w-full flex flex-row items-center text-sm outline-none px-2 py-3.5"
                placeholder="Phone Number"
                {...field}
              />
            );
          }}
        />
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={() => flow.gotBack()}
          variant="ghost"
          className="border-0 bg-accent w-[48%]"
        >
          Go Back
        </ActionButton>

        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={sendOTPMutation.isPending}
          variant="secondary"
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          Continue
        </ActionButton>
      </div>
    </motion.div>
  );
}
