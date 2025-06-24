import useOTP from "@/hooks/data/use-otp";
import useEmailOTP from "@/hooks/data/use-email-otp";
import useExternalIdAuth from "@/hooks/data/use-external-id-auth";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { useFlow } from "../known/flow-context";
import { ReactNode, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ActionButton from "@/components/ui/action-button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

const otpSchema = z.object({
  code: z.string().length(4),
});

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type OTP_SCHEMA = z.infer<typeof otpSchema>;
type PASSWORD_SCHEMA = z.infer<typeof passwordSchema>;

interface OTPConfirmProps {
  render: () => ReactNode;
}

export default function OTPConfirm(props: OTPConfirmProps) {
  const { render } = props;
  const flow = useFlow();
  const [showPassword, setShowPassword] = useState(false);

  // Get auth hooks
  const { requestOTPMutation, verifyOTPMutation } = useOTP();
  const { requestEmailOTPMutation, verifyEmailOTPMutation, userEmail } =
    useEmailOTP();
  const { verifyExternalIdMutation, userExternalId } = useExternalIdAuth();
  const { userQuery } = useWalletAuth();

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Determine auth method automatically using sphere.auth.getUser()
  const authMethod = useMemo(() => {
    const userData = userQuery?.data;

    // Check what's available from getUser() response
    if (userData?.phoneNumber) return "phone-otp";
    if (userData?.email) return "email-otp";
    if (userData?.externalId) return "external-id-password";

    // Fallback to localStorage if userData not available yet
    const hasPhone = localStorage.getItem("phoneNumber");
    const hasEmail = localStorage.getItem("email");
    const hasExternalId = localStorage.getItem("externalId");

    if (hasPhone) return "phone-otp";
    if (hasEmail) return "email-otp";
    if (hasExternalId) return "external-id-password";

    return "phone-otp"; // fallback
  }, [userQuery?.data]);

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleRequestOtp = async () => {
    try {
      if (authMethod === "phone-otp") {
        await requestOTPMutation.mutateAsync();
      } else if (authMethod === "email-otp") {
        await requestEmailOTPMutation.mutateAsync();
      }
    } catch (e) {
      console.log("Something went wrong requesting OTP:", e);
    }
  };

  useEffect(() => {
    if (isOpen && (authMethod === "phone-otp" || authMethod === "email-otp")) {
      handleRequestOtp();
    }
  }, [isOpen, authMethod]);

  const handleOTPConfirm = async (values: OTP_SCHEMA) => {
    try {
      let isValid = false;

      if (authMethod === "phone-otp") {
        isValid = await verifyOTPMutation.mutateAsync({
          otp: values.code,
        });
      } else if (authMethod === "email-otp") {
        isValid = await verifyEmailOTPMutation.mutateAsync({
          otp: values.code,
        });
      }

      if (!isValid) {
        // TODO: toast to say otp invalid
        return;
      }

      flow.state?.setValue("authMethod", authMethod);

      const state = flow.state?.getValues();
      if (!state) return;

      flow.goToNext("processing");

      // Send transaction with OTP and user's auth credentials
      const userData = userQuery?.data;
      const contactType = state?.contactType;
      const recipient = state?.recipient;

      // Prepare recipient identifier based on contact type
      let recipientIdentifier: any = {};
      if (recipient !== "anonymous") {
        switch (contactType) {
          case "email":
            recipientIdentifier.recipientEmail = recipient;
            break;
          case "externalId":
            recipientIdentifier.recipientExternalId = recipient;
            break;
          case "phone":
          case "telegram":
          default:
            recipientIdentifier.recipientPhoneNumber = recipient;
            break;
        }
      }

      // Prepare auth payload based on user's auth method
      let authPayload: any = {
        otpCode: values.code,
      };

      if (authMethod === "email-otp") {
        authPayload.email = userData?.email || userEmail;
      }
      // For phone-otp, phoneNumber is automatically included by the backend

      flow.sendTransactionMutation!.mutate({
        amount: state.amount!,
        chain: state.chain!,
        recipient: state.recipient!,
        token: state.token!,
        ...authPayload,
        ...recipientIdentifier,
      });

      onClose();
    } catch (e) {
      console.log("Error::", e);
    }
  };

  const handlePasswordConfirm = async (values: PASSWORD_SCHEMA) => {
    try {
      const isValid = await verifyExternalIdMutation.mutateAsync({
        password: values.password,
      });

      if (!isValid) {
        // TODO: toast to say credentials invalid
        return;
      }

      flow.state?.setValue("authMethod", authMethod);

      const state = flow.state?.getValues();
      if (!state) return;

      flow.goToNext("processing");

      // Send transaction with external ID and password
      const userData = userQuery?.data;
      const contactType = state?.contactType;
      const recipient = state?.recipient;

      // Prepare recipient identifier based on contact type
      let recipientIdentifier: any = {};
      if (recipient !== "anonymous") {
        switch (contactType) {
          case "email":
            recipientIdentifier.recipientEmail = recipient;
            break;
          case "externalId":
            recipientIdentifier.recipientExternalId = recipient;
            break;
          case "phone":
          case "telegram":
          default:
            recipientIdentifier.recipientPhoneNumber = recipient;
            break;
        }
      }

      flow.sendTransactionMutation!.mutate({
        amount: state.amount!,
        chain: state.chain!,
        recipient: state.recipient!,
        token: state.token!,
        externalId: userData?.externalId || userExternalId,
        password: values.password,
        ...recipientIdentifier,
      });

      onClose();
    } catch (e) {
      console.log("Error::", e);
    }
  };

  const IS_OTP_VALID = otpForm.watch("code")?.trim()?.length == 4;
  const IS_PASSWORD_VALID = passwordForm.formState.isValid;

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
          <DrawerTitle className="hidden">Authentication</DrawerTitle>
          <DrawerDescription className="hidden">
            Transaction Authentication
          </DrawerDescription>
        </DrawerHeader>

        {authMethod === "phone-otp" || authMethod === "email-otp" ? (
          <Controller
            control={otpForm.control}
            name="code"
            render={({ field }) => {
              return (
                <div className="flex flex-col items-center justify-between w-full p-5 h-full gap-5">
                  <p className="flex flex-row text-muted-foreground text-center">
                    We just sent you an OTP to{" "}
                    {authMethod === "email-otp" ? "your email" : "your phone"}{" "}
                    to confirm this transaction.
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
                          className="font-semibold text-accent-secondary active:scale-95 cursor-pointer"
                        >
                          Resend
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-center">
                    <ActionButton
                      size="small"
                      disabled={!IS_OTP_VALID}
                      loading={
                        requestOTPMutation.isPending ||
                        verifyOTPMutation.isPending ||
                        requestEmailOTPMutation.isPending ||
                        verifyEmailOTPMutation.isPending ||
                        flow.sendTransactionMutation?.isPending
                      }
                      onClick={otpForm.handleSubmit(handleOTPConfirm)}
                      variant="secondary"
                    >
                      <p className="font-semibold text-white">Confirm</p>
                    </ActionButton>
                  </div>
                </div>
              );
            }}
          />
        ) : (
          <Controller
            control={passwordForm.control}
            name="password"
            render={({ field, fieldState }) => {
              return (
                <div className="flex flex-col items-center justify-between w-full p-5 h-full gap-5">
                  <p className="flex flex-row text-muted-foreground text-center">
                    Enter your password to confirm this transaction.
                  </p>

                  <div className="flex flex-col items-center w-full gap-3">
                    <div className="relative w-full max-w-sm">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-secondary border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOffIcon size={18} />
                        ) : (
                          <EyeIcon size={18} />
                        )}
                      </button>
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
                      disabled={!IS_PASSWORD_VALID}
                      loading={
                        verifyExternalIdMutation.isPending ||
                        flow.sendTransactionMutation?.isPending
                      }
                      onClick={passwordForm.handleSubmit(handlePasswordConfirm)}
                      variant="secondary"
                    >
                      <p className="font-semibold text-white">Confirm</p>
                    </ActionButton>
                  </div>
                </div>
              );
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
