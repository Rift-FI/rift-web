import { ReactNode } from "react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDisclosure } from "@/hooks/use-disclosure";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import { RECOVERY_SCHEMA_TYPE, recoverySchema, useRecovery } from "../context";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import ActionButton from "@/components/ui/action-button";

interface Props {
  renderTrigger: () => ReactNode;
  recovery_method: "phone" | "email";
  emailAddress?: string;
  countryCode?: string;
  phoneNumber?: string;
}

export default function PasswordConfirmUpdate(
  props: Props & ReturnType<typeof useDisclosure>
) {
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const { signInMutation, addRecoveryMutation } = useRecovery();
  const { userQuery } = useWalletAuth();

  const form = useForm<RECOVERY_SCHEMA_TYPE>({
    resolver: zodResolver(recoverySchema),
  });

  const onVerify = async () => {
    try {
      const PASSWORD = form.getValues("password");
      const EXTERNAL_ID = userQuery?.data?.externalId;

      const isVerified = await signInMutation?.mutateAsync({
        externalId: EXTERNAL_ID,
        password: PASSWORD,
      });

      if (isVerified) {
        toast.success("Updating account recovery");

        let phoneNum = props.phoneNumber?.startsWith("0")
          ? props.phoneNumber?.trim().replace("0", "")
          : props.phoneNumber?.trim();
        phoneNum = props.countryCode?.trim() + "-" + phoneNum;

        addRecoveryMutation
          ?.mutateAsync({
            externalId: EXTERNAL_ID!,
            method:
              props.recovery_method == "email"
                ? "emailRecovery"
                : "phoneRecovery",
            password: PASSWORD!,
            value:
              props.recovery_method == "email" ? props.emailAddress! : phoneNum,
          })
          .then(() => {
            toast.success("Recovery method was updated successfully");
            onClose();
          })
          .catch(() => {
            toast.error("Failed to update your recovery method");
          });
      } else {
        toast.error("Verification failed, please try again");
      }
    } catch (e) {
      console.log(e);
      toast.error("Verification failed, please try again");
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) return onOpen();
        onClose();
      }}
    >
      <DrawerTrigger asChild className="w-full">
        {renderTrigger()}
      </DrawerTrigger>
      <DrawerContent className="h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Authentication</DrawerTitle>
          <DrawerDescription className="hidden">
            Transaction Authentication
          </DrawerDescription>
        </DrawerHeader>

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => {
            return (
              <div className="flex flex-col items-center justify-between w-full p-5 h-full gap-5">
                <p className="flex flex-row text-muted-foreground text-center">
                  Enter your password to verify it's you
                </p>

                <div className="flex flex-col items-center w-full gap-3">
                  <div className="relative w-full max-w-sm">
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      className="bg-secondary border-border pr-10"
                    />
                  </div>

                  {fieldState.error && (
                    <p className="text-sm text-danger">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-row items-center justify-center">
                  <ActionButton
                    size="small"
                    variant="secondary"
                    loading={
                      signInMutation?.isPending ||
                      addRecoveryMutation?.isPending
                    }
                    disabled={
                      signInMutation?.isPending ||
                      addRecoveryMutation?.isPending
                    }
                    onClick={onVerify}
                  >
                    <p className="font-semibold text-white">Confirm</p>
                  </ActionButton>
                </div>
              </div>
            );
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
