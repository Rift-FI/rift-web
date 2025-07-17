import { ReactNode } from "react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDisclosure } from "@/hooks/use-disclosure";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { RECOVERY_SCHEMA_TYPE, recoverySchema, useRecovery } from "../context";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import ActionButton from "@/components/ui/action-button";

interface Props {
  recovery_method: "phone" | "email";
  emailAddress?: string;
  countryCode?: string;
  phoneNumber?: string;
}

export default function PasswordConfirmCreate(
  props: Props & ReturnType<typeof useDisclosure>
) {
  const { isOpen, onOpen, onClose } = props;
  const { signInMutation, addRecoveryMutation, createRecoveryMutation } =
    useRecovery();
  const { userQuery } = useWalletAuth();

  const form = useForm<RECOVERY_SCHEMA_TYPE>({
    resolver: zodResolver(recoverySchema),
  });

  const PASSWORD = form.watch("password");

  const onVerify = async () => {
    try {
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

        createRecoveryMutation
          ?.mutateAsync({
            externalId: EXTERNAL_ID!,
            password: PASSWORD!,
            emailRecovery: props.emailAddress,
            phoneRecovery: phoneNum,
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
      <DrawerContent className="min-h-fit h-[60vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Authentication</DrawerTitle>
          <DrawerDescription>Transaction Authentication</DrawerDescription>
        </DrawerHeader>

        <div className="h-[60vh] p-4 mb-4">
          <p className="text-md font-semibold">Confirm</p>
          <p className="text-sm">Use your password to verify it's you</p>

          <div className="w-full mt-8">
            <p className="text-sm">Enter your password</p>

            <Controller
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <div className="w-full mt-2 rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border">
                    <input
                      {...field}
                      className="w-full flex bg-transparent border-none outline-none h-full text-md text-foreground placeholder:text-muted-foreground flex-1 font-bold"
                      placeholder="* * * * * *"
                      type="password"
                    />
                  </div>
                );
              }}
            />
          </div>

          <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
            <ActionButton
              variant="secondary"
              loading={
                signInMutation?.isPending || addRecoveryMutation?.isPending
              }
              disabled={
                !PASSWORD ||
                signInMutation?.isPending ||
                addRecoveryMutation?.isPending
              }
              onClick={onVerify}
              className="p-[0.625rem]"
            >
              Confirm
            </ActionButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
