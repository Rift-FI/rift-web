import { useMemo } from "react";
import { motion } from "motion/react";
import { useParams, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown, SearchIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDisclosure } from "@/hooks/use-disclosure";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import RecoveryContextProvider, {
  RECOVERY_SCHEMA_TYPE,
  recoverySchema,
} from "./context";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";
import PasswordConfirmCreate from "./components/ConfirmCreate";
import PasswordConfirmUpdate from "./components/ConfirmUpdate";
import COUNTRY_PHONES from "@/lib/country-phones";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";

function RecoveryCtr() {
  const navigate = useNavigate();
  const { method: recovery_method } = useParams() as {
    method: "phone" | "email";
  };
  const confirm_create_disclosure = useDisclosure();
  const confirm_update_disclosure = useDisclosure();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { userQuery } = useWalletAuth();
  const { recoveryMethodsQuery } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
  });

  const form = useForm<RECOVERY_SCHEMA_TYPE>({
    resolver: zodResolver(recoverySchema),
  });

  const COUNTRY = form.watch("countryCode");
  const EMAIL_ADDR = form.watch("emailAddress");
  const PHONE_NUMBER = form.watch("phoneNumber");
  const PHONE_SEARCH_FILTER = form.watch("phonesearchfilter");

  const onCancel = () => {
    navigate("/app/profile");
  };

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

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto p-4"
    >
      <div className="flex flex-col items-center justify-center">
        <span className="text-md font-medium">Account Recovery</span>
        <span className="text-sm">
          Add a recovery&nbsp;
          {recovery_method == "phone" ? "Phone Number" : "Email Address"}
        </span>
      </div>

      {recovery_method == "phone" && (
        <div className="flex flex-row w-full gap-1 mt-4 border-1 border-accent rounded-md">
          <Controller
            control={form.control}
            name="countryCode"
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
                    <div className="border-r-1 border-accent px-[0.75rem] py-2 h-full">
                      <div className="w-fit h-full flex flex-row gap-x-1 items-center justify-center">
                        {countryDetails.flag}
                        <span className="text-xs font-semibold">
                          {countryDetails.code}
                        </span>
                      </div>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent className="min-h-fit h-[60vh]">
                    <DrawerHeader className="hidden">
                      <DrawerTitle>Phone</DrawerTitle>
                      <DrawerDescription>Phone contry-code</DrawerDescription>
                    </DrawerHeader>

                    <div className="w-full flex flex-row items-center gap-x-2 px-3 py-3 bg-app-background border-b-1 border-border">
                      <SearchIcon className="text-muted-foreground" size={18} />
                      <input
                        className="flex bg-transparent border-none outline-none h-full text-foreground placeholder:text-muted-foreground flex-1"
                        placeholder="Search..."
                        value={PHONE_SEARCH_FILTER ?? ""}
                        onChange={(e) =>
                          form.setValue("phonesearchfilter", e.target.value)
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
                              form.setValue("phonesearchfilter", "");
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
            name="phoneNumber"
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
      )}

      {recovery_method == "email" && (
        <div className="mt-4 w-full">
          <Controller
            control={form.control}
            name="emailAddress"
            render={({ field, fieldState }) => {
              return (
                <div className="w-full flex flex-row items-center rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                  <input
                    {...field}
                    type="text"
                    inputMode="email"
                    placeholder="your-email-address@email.com"
                    className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                  />
                </div>
              );
            }}
          />
        </div>
      )}

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onCancel}
          variant="ghost"
          className="border-0 bg-accent w-[48%]"
        >
          Close
        </ActionButton>

        {recoveryMethodsQuery.data?.recoveryOptions.email == null &&
        recoveryMethodsQuery.data?.recoveryOptions.phone == null ? (
          <ActionButton
            variant="secondary"
            disabled={
              typeof PHONE_NUMBER == undefined ||
              typeof EMAIL_ADDR == undefined ||
              PHONE_NUMBER == "" ||
              EMAIL_ADDR == ""
            }
            onClick={() => confirm_create_disclosure.onOpen()}
          >
            Verify
          </ActionButton>
        ) : (
          <ActionButton
            variant="secondary"
            disabled={
              typeof PHONE_NUMBER == undefined ||
              typeof EMAIL_ADDR == undefined ||
              PHONE_NUMBER == "" ||
              EMAIL_ADDR == ""
            }
            onClick={() => confirm_update_disclosure.onOpen()}
          >
            Verify
          </ActionButton>
        )}

        <PasswordConfirmCreate
          {...confirm_create_disclosure}
          recovery_method={recovery_method}
          emailAddress={EMAIL_ADDR}
          countryCode={COUNTRY}
          phoneNumber={PHONE_NUMBER}
        />

        <PasswordConfirmUpdate
          {...confirm_update_disclosure}
          recovery_method={recovery_method}
          emailAddress={EMAIL_ADDR}
          countryCode={COUNTRY}
          phoneNumber={PHONE_NUMBER}
        />
      </div>
    </motion.div>
  );
}

export default function Recovery() {
  return (
    <RecoveryContextProvider>
      <RecoveryCtr />
    </RecoveryContextProvider>
  );
}
