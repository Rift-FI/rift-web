import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import COUNTRY_PHONES from "@/lib/country-phones";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useFlow } from "../context";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import ActionButton from "@/components/ui/action-button";
import { toast } from "sonner";
import RenderErrorToast from "@/components/ui/helpers/render-error-toast";

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
  const stored = flow.stateControl.getValues();
  const form = useForm<IDENTIFIER_SCHEMA>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      country: stored?.identifier?.split("-")?.at(0),
      phone: stored?.identifier?.split("-")?.at(1),
    },
  });

  const { sendOTPMutation } = useWalletAuth();

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
    <div className="flex flex-col w-full h-full items-center justify-between p-5 pb-10">
      <div />

      <div className="flex flex-col gap-5 w-full h-4/5">
        <div
          className="flex flex-row items-center gap-4 cursor-pointer"
          onClick={() => flow.gotBack()}
        >
          <ArrowLeft />
          <p className="font-semibold text-2xl">Phone</p>
        </div>
        <p>Enter your phone number to continue.</p>

        <div className="flex flex-row w-full gap-1">
          <Controller
            control={form.control}
            name="country"
            render={({ field }) => {
              const COUNTRY = field.value;
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
                    <div className="flex flex-row items-center justify-center gap-1 rounded-md bg-accent px-2 py-2 h-full">
                      {countryDetails ? (
                        <div className="flex flex-row gap-x-1">
                          {countryDetails.flag}
                        </div>
                      ) : (
                        <ChevronDown />
                      )}
                    </div>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="hidden">Login</DrawerTitle>
                      <DrawerDescription className="hidden">
                        Login with Phone & OTP
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="w-full h-[40vh] px-5 pb-5 gap-5 overflow-scroll">
                      {COUNTRY_PHONES?.map((country) => {
                        return (
                          <div
                            onClick={() => {
                              field.onChange(country.code);
                              onClose();
                            }}
                            key={country.code}
                            className="w-full flex flex-row items-center justify-between gap-x-2 rounded-md active:bg-input px-2 py-3 cursor-pointer active:scale-95"
                          >
                            <p>{country.countryname}</p>
                            <div className="flex flex-row items-center gap-x-2 w-[15%]">
                              <p>{country.flag}</p>
                              <p>{country.code}</p>
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
                  className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                  placeholder="Phone Number"
                  {...field}
                />
              );
            }}
          />
        </div>

        <p className="text-muted-foreground">
          We'll use you phone number for authentication.
        </p>
      </div>

      <div className="w-full flex flex-row items-center">
        <ActionButton
          disabled={!ENABLE_CONTINUE}
          loading={sendOTPMutation.isPending}
          variant={"secondary"}
          onClick={form.handleSubmit(handleSubmit, handleError)}
        >
          <p className=" text-white text-xl">Continue</p>
        </ActionButton>
      </div>
    </div>
  );
}
