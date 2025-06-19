import useOTP from "@/hooks/data/use-otp";
import { useFlow } from "../known/flow-context";
import { ReactNode, useEffect } from "react";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ActionButton from "@/components/ui/action-button";

const otpSchema = z.object({
  code: z.string().length(4),
});

type OTP_SCHEMA = z.infer<typeof otpSchema>;

interface OTPConfirmProps {
  render: () => ReactNode;
}
export default function OTPConfirm(props: OTPConfirmProps) {
  const { render } = props;
  const flow = useFlow();
  const { requestOTPMutation, verifyOTPMutation } = useOTP();

  const { isOpen, onOpen, onClose, toggle } = useDisclosure();

  const form = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const handleRequestOtp = async () => {
    try {
      await requestOTPMutation.mutateAsync();
    } catch (e) {
      console.log("Something went wrong:: ", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleRequestOtp();
    }
  }, [isOpen]);

  const handleConfirm = async (values: OTP_SCHEMA) => {
    console.log("Values::", values);
    try {
      const isValid = await verifyOTPMutation.mutateAsync({
        otp: values.code,
      });

      if (!isValid) {
        // TODO: toast to say otp invalid
        return;
      }

      const state = flow.state?.getValues();

      if (!state) {
        return;
      }

      flow.goToNext("processing"); // navigate to processing then send the transaction
      // These are all expected to be defined at this point in the flow
      flow.sendTransactionMutation!.mutate({
        amount: state.amount!,
        chain: state.chain!,
        recipient: state.recipient!,
        token: state.token!,
      });
    } catch (e) {
      console.log("Error::", e);
      // TODO: handle error
    }
  };

  const IS_CODE_VALID = form.watch("code")?.trim()?.length == 4;

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) return onOpen();
        onClose();
      }}
    >
      <DrawerTrigger className="w-full">{render()}</DrawerTrigger>
      <DrawerContent className="h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">OTP</DrawerTitle>
          <DrawerDescription className="hidden">
            OTP Verification
          </DrawerDescription>
        </DrawerHeader>
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => {
            return (
              <div className="flex flex-col items-center justify-between w-full p-5 h-full gap-5">
                <p className="flex flex-row text-muted-foreground text-center">
                  We just sent you an OTP to confirm this transaction.
                </p>

                <div className="flex flex-col items-center w-full gap-3">
                  <InputOTP
                    value={field.value}
                    onChange={field.onChange}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                  <div className="flex flex-row">
                    <p className="text-center">
                      Didn't receive it yet? <br />{" "}
                      <span
                        onClick={handleRequestOtp}
                        className="font-semibold text-accent-secondary active:scale-95"
                      >
                        Resend
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-center">
                  <ActionButton
                    size={"small"}
                    disabled={!IS_CODE_VALID}
                    loading={
                      requestOTPMutation.isPending ||
                      verifyOTPMutation.isPending ||
                      flow.sendTransactionMutation?.isPending
                    }
                    onClick={form.handleSubmit(handleConfirm)}
                    variant={"secondary"}
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
