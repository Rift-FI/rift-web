import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { ChevronDown } from "lucide-react";
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
  const disclosure = useDisclosure();
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

  const goBack = () => {
    navigate(-1);
  };

  const countryDetails = useMemo(() => {
    const country = COUNTRY_PHONES.find((c) => c.code == COUNTRY);
    return country ?? null;
  }, [COUNTRY]);

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <button
        onClick={goBack}
        className="flex flex-row items-center justify-start p-1 pr-4 mb-2 rounded-full bg-secondary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <MdKeyboardArrowLeft className="text-2xl text-text-default" />
        <span className="text-sm font-bold">Go Back</span>
      </button>

      <p className="text-center text-lg font-semibold">
        Account Recovery <br />
        <span className="text-sm font-medium">
          Add a recovery{" "}
          {recovery_method == "phone" ? "Phone Number" : "Email Address"}
        </span>
      </p>

      {recovery_method == "phone" && (
        <div className="flex flex-row w-full gap-1 mt-4">
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
                    <DrawerHeader className="hidden">
                      <DrawerTitle>Login</DrawerTitle>
                      <DrawerDescription>
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
            name="phoneNumber"
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
      )}

      {recovery_method == "email" && (
        <div className="mt-4 w-full">
          <Controller
            control={form.control}
            name="emailAddress"
            render={({ field, fieldState }) => {
              return (
                <div className="w-full">
                  <input
                    className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                    placeholder="Email Address"
                    type="email"
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>
      )}

      {recoveryMethodsQuery.data?.recoveryOptions.email == null &&
      recoveryMethodsQuery.data?.recoveryOptions.email == null ? (
        <PasswordConfirmCreate
          {...disclosure}
          recovery_method={recovery_method}
          emailAddress={EMAIL_ADDR}
          countryCode={COUNTRY}
          phoneNumber={PHONE_NUMBER}
          renderTrigger={() => (
            <ActionButton
              disabled={PHONE_NUMBER == "" || EMAIL_ADDR == ""}
              className="w-auto fixed bottom-4 left-4 right-4"
            >
              Verify
            </ActionButton>
          )}
        />
      ) : (
        <PasswordConfirmUpdate
          {...disclosure}
          recovery_method={recovery_method}
          emailAddress={EMAIL_ADDR}
          countryCode={COUNTRY}
          phoneNumber={PHONE_NUMBER}
          renderTrigger={() => (
            <ActionButton
              disabled={PHONE_NUMBER == "" || EMAIL_ADDR == ""}
              className="w-auto fixed bottom-4 left-4 right-4"
            >
              Verify
            </ActionButton>
          )}
        />
      )}
    </div>
  );
}

export default function Recovery() {
  return (
    <RecoveryContextProvider>
      <RecoveryCtr />
    </RecoveryContextProvider>
  );
}
