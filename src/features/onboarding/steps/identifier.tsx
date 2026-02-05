import { useMemo } from "react";
import { motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { SearchIcon } from "lucide-react";
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
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

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
  const isDesktop = useDesktopDetection();

  const stored = flow.stateControl.getValues();

  const form = useForm<IDENTIFIER_SCHEMA>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      country: stored?.identifier?.split("-")?.at(0) || "+254", // Default to Kenya
      phone: stored?.identifier?.split("-")?.at(1),
    },
  });

  const COUNTRY = form.watch("country");
  const PHONE_SEARCH_FILTER = flow.stateControl.watch("phonesearchfilter");
  const PHONE_VALUE = form.watch("phone");
  const ENABLE_CONTINUE = PHONE_VALUE?.trim().length > 0;

  const countryDetails = useMemo(() => {
    const country = COUNTRY_PHONES.find((c) => c.code == COUNTRY);
    return country ?? COUNTRY_PHONES[0];
  }, [COUNTRY]);

  const country_phones = useMemo(() => {
    if (
      !PHONE_SEARCH_FILTER ||
      PHONE_SEARCH_FILTER?.trim().length == 0 ||
      PHONE_SEARCH_FILTER == ""
    ) {
      return COUNTRY_PHONES;
    }

    const filtered = COUNTRY_PHONES?.filter(
      (_countryphone) =>
        _countryphone.countryname
          .toLocaleLowerCase()
          .includes(PHONE_SEARCH_FILTER.toLocaleLowerCase()) ||
        _countryphone.code.includes(PHONE_SEARCH_FILTER)
    );
    return filtered ?? [];
  }, [PHONE_SEARCH_FILTER]);

  const handleSubmit = async (values: IDENTIFIER_SCHEMA) => {
    
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
      
      
      // On phone OTP failure during signup, redirect to email signup
      if (flowType !== "login") {
        toast.custom(
          () => (
            <RenderErrorToast message="SMS failed. Try signing up with email instead." />
          ),
          {
            duration: 3000,
            position: "top-center",
          }
        );
        // Switch to email auth method and navigate to email step
        flow.stateControl.setValue("authMethod", "email");
        flow.goToNext("email");
        return;
      }
      
      toast.custom(() => <RenderErrorToast />, {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleError = (error: any) => {
    
    toast.custom(
      () => <RenderErrorToast message="Fill the input correctly" />,
      {
        duration: 2000,
        position: "top-center",
      }
    );
  };

  const content = (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`w-full h-full ${isDesktop ? "p-8" : "p-4"}`}
    >
      <div className={isDesktop ? "max-w-md mx-auto" : ""}>
        <p className={`font-medium ${isDesktop ? "text-xl mb-2" : "text-md"}`}>Phone</p>
        <p className={`${isDesktop ? "text-base mb-6" : "text-sm mb-4"}`}>Enter your phone number to continue</p>

        <div className={`flex flex-row w-full gap-1 ${isDesktop ? "mt-6" : "mt-4"} border-2 border-accent-primary/20 rounded-2xl bg-white p-1`}>
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
                  <div className={`border-r-2 border-accent-primary/20 ${isDesktop ? "px-4 py-3" : "px-[0.75rem] py-2"} h-full rounded-l-2xl hover:bg-accent-primary/5 transition-colors`}>
                    <div className="w-fit h-full flex flex-row gap-x-2 items-center justify-center">
                      {countryDetails.flag}
                      <span className={`${isDesktop ? "text-sm" : "text-xs"} font-semibold`}>
                        {countryDetails.code}
                      </span>
                    </div>
                  </div>
                </DrawerTrigger>
                <DrawerContent className={`min-h-fit h-[60vh] ${isDesktop ? "max-w-md" : ""}`}>
                  <DrawerHeader className="hidden">
                    <DrawerTitle>Phone</DrawerTitle>
                    <DrawerDescription>Phone contry-code</DrawerDescription>
                  </DrawerHeader>

                  <div className="w-full flex flex-row items-center gap-x-2 px-3 py-3 bg-app-background border-b-1 border-border">
                    <SearchIcon className="text-muted-foreground" size={18} />
                    <input
                      className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1"
                      placeholder="Search..."
                      value={PHONE_SEARCH_FILTER || ""}
                      onChange={(e) =>
                        flow.stateControl.setValue(
                          "phonesearchfilter",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="w-full h-[50vh] p-4 pt-1 gap-3 overflow-scroll">
                    {country_phones?.map((country, idx) => {
                      return (
                        <div
                          onClick={() => {
                            field.onChange(country.code);
                            onClose();
                            flow.stateControl.setValue("phonesearchfilter", "");
                          }}
                          key={country.code + idx}
                          className="w-full flex flex-row items-center justify-between gap-x-2 py-3 cursor-pointer"
                        >
                          <p className="text-sm">{country.countryname}</p>
                          <div className="flex flex-row items-center gap-x-2 w-[15%]">
                            <p>{country.flag}</p>
                            <p className="text-sm font-medium">
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
                className={`w-full flex flex-row items-center ${isDesktop ? "text-base px-4 py-4" : "text-sm px-2 py-3.5"} outline-none rounded-r-2xl`}
                placeholder="000 - 000 - 000"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            );
          }}
        />
      </div>

        <div className={`flex flex-row flex-nowrap gap-3 ${isDesktop ? "mt-8 max-w-md mx-auto" : "fixed bottom-0 left-0 right-0"} p-4 py-2 ${isDesktop ? "" : "border-t-1 border-border bg-app-background"}`}>
          <button
            onClick={() => flow.gotBack()}
            className={`flex items-center justify-center ${isDesktop ? "flex-1 py-2.5 px-4" : "w-[48%] py-2.5 px-3"} rounded-2xl text-sm font-medium bg-accent-primary text-white hover:opacity-90 transition-opacity`}
          >
            Go Back
          </button>

          <button
            disabled={!ENABLE_CONTINUE || sendOTPMutation.isPending}
            onClick={form.handleSubmit(handleSubmit, handleError)}
            className={`flex items-center justify-center ${isDesktop ? "flex-1 py-2.5 px-4" : "w-[48%] py-2.5 px-3"} rounded-2xl text-sm font-medium bg-accent-secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {sendOTPMutation.isPending ? (
              <span className="opacity-70">Loading...</span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="md" className="h-full flex items-center justify-center">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
