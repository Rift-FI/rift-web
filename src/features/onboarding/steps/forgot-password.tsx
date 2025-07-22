import { ReactNode } from "react";
import { motion } from "motion/react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { toast } from "sonner";
import { useFlow } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { shortenString } from "@/lib/utils";

const resetPasswordSchema = z.object({
  externalId: z.string().min(3, "Username must be at least 3 characters"),
  newpassword: z.string().min(8, "Use a password longer than 8 characters"),
  confirmpassword: z.string().min(8, "Use a password longer than 8 characters"),
});

type RESET_PASSWORD_SCHEMA_TYPE = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const flow = useFlow();
  const disclosure = useDisclosure();

  const resetPasswordForm = useForm<RESET_PASSWORD_SCHEMA_TYPE>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      externalId: "",
      newpassword: "",
    },
  });

  const EXTERNAL_ID = resetPasswordForm.watch("externalId");
  const PASSWORD = resetPasswordForm.watch("newpassword");
  const CONFIRMPASSWORD = resetPasswordForm.watch("confirmpassword");

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <p className="font-medium text-md">Forgot Password</p>
      <p className="text-sm">
        Enter your username and a new password for your wallet
      </p>

      <div className="flex flex-col w-full gap-2 mt-4">
        <Controller
          control={resetPasswordForm.control}
          name="externalId"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="text"
                  inputMode="text"
                  placeholder="Username"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />

        <Controller
          control={resetPasswordForm.control}
          name="newpassword"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="password"
                  inputMode="text"
                  placeholder="New Password"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />

        <Controller
          control={resetPasswordForm.control}
          name="confirmpassword"
          render={({ field }) => {
            return (
              <div className="w-full rounded-[0.75rem] px-3 py-4 bg-app-background border-1 border-border mt-2">
                <input
                  {...field}
                  type="password"
                  inputMode="text"
                  placeholder="Retype New Password"
                  className="flex bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-sm"
                />
              </div>
            );
          }}
        />
      </div>

      <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={() => flow.gotBack("login-username-password")}
          variant="ghost"
          className="border-0 bg-accent w-[48%]"
        >
          Go Back
        </ActionButton>

        <RequestPasswordReset
          {...disclosure}
          extenalId={EXTERNAL_ID!}
          newPassword={PASSWORD!}
          renderTrigger={() => (
            <ActionButton
              variant="secondary"
              disabled={
                EXTERNAL_ID == "" ||
                PASSWORD == "" ||
                CONFIRMPASSWORD == "" ||
                PASSWORD !== CONFIRMPASSWORD
              }
            >
              Reset Password
            </ActionButton>
          )}
        />
      </div>
    </motion.div>
  );
}

//
interface Props {
  renderTrigger: () => ReactNode;
  extenalId: string;
  newPassword: string;
  recoveryMethod?: "phoneRecovery" | "emailRecovery";
  recoveryMethodValue?: string;
}

function RequestPasswordReset(props: Props & ReturnType<typeof useDisclosure>) {
  const disclosure = useDisclosure();
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const { recoveryMethodsQuery, requestRecoveryMutation } = useWalletRecovery({
    externalId: props.extenalId,
  });
  console.log(recoveryMethodsQuery.data?.recoveryOptions);

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
      <DrawerContent className="min-h-fit h-[35vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Password Reset</DrawerTitle>
          <DrawerDescription>Request Password Reset - OTP</DrawerDescription>
        </DrawerHeader>
        <div className="w-full p-4 h-[35vh]">
          {recoveryMethodsQuery?.data?.recoveryOptions && (
            <div className="flex flex-col">
              <span className="text-lg font-medium">Reset Password</span>

              <span className="text-sm">
                We will send you an OTP to the recovery phone number or email
                address you set
              </span>
            </div>
          )}

          {recoveryMethodsQuery.data?.recoveryOptions?.email == null &&
            recoveryMethodsQuery.data?.recoveryOptions?.phone == null && (
              <p className="mt-10 text-center text-sm">
                You need to setup an account recovery Phone Number or Eamil
                Address to change your password
              </p>
            )}

          {recoveryMethodsQuery.data?.recoveryOptions?.email && (
            <ResetPasswordOTP
              {...disclosure}
              extenalId={props.extenalId}
              newPassword={props.newPassword}
              recoveryMethod="emailRecovery"
              recoveryMethodValue={requestRecoveryMutation.data?.target}
              renderTrigger={() => (
                <ActionButton
                  onClick={() =>
                    requestRecoveryMutation.mutateAsync({
                      externalId: props.extenalId,
                      method: "emailRecovery",
                    })
                  }
                  className="w-full bg-transparent p-3 mt-4 rounded-lg border-2 border-surface-subtle"
                >
                  <span className="w-full flex flex-row items-center justify-between">
                    <span className="text-text-subtle">
                      {recoveryMethodsQuery.data?.recoveryOptions?.email}
                    </span>
                    <MdAlternateEmail className="text-text-subtle text-xl" />
                  </span>
                </ActionButton>
              )}
            />
          )}

          {recoveryMethodsQuery.data?.recoveryOptions?.phone && (
            <ResetPasswordOTP
              {...disclosure}
              extenalId={props.extenalId}
              newPassword={props.newPassword}
              recoveryMethod="phoneRecovery"
              recoveryMethodValue={requestRecoveryMutation.data?.target}
              renderTrigger={() => (
                <ActionButton
                  onClick={() =>
                    requestRecoveryMutation.mutateAsync({
                      externalId: props.extenalId,
                      method: "phoneRecovery",
                    })
                  }
                  className="w-full bg-transparent p-3 mt-4 rounded-lg border-2 border-surface-subtle"
                >
                  <span className="w-full flex flex-row items-center justify-between">
                    <span className="text-text-subtle">
                      {recoveryMethodsQuery.data?.recoveryOptions?.phone}
                    </span>
                    <HiPhone className="text-text-subtle text-xl" />
                  </span>
                </ActionButton>
              )}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

//
const otpCodeSchema = z.object({
  code: z.string().max(4),
});

type OTP_CODE_SCHEMA_TYPE = z.infer<typeof otpCodeSchema>;

function ResetPasswordOTP(props: Props & ReturnType<typeof useDisclosure>) {
  const { renderTrigger, isOpen, onOpen, onClose } = props;
  const flow = useFlow();
  const {
    requestRecoveryMutation,
    phoneResetPasswordMutation,
    emailResetPasswordMutation,
  } = useWalletRecovery({});

  const form = useForm<OTP_CODE_SCHEMA_TYPE>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const OTP_CODE = form.watch("code");

  const onSuccess = () => {
    toast.success("Your password was reset, please login");
    flow.gotBack("login-username-password");
    onClose();
  };

  const onFailure = () => {
    toast.error("We couldn't reset your password, please try again");
    onClose();
  };

  const onResetPassword = () => {
    props.recoveryMethod == "emailRecovery"
      ? emailResetPasswordMutation
          .mutateAsync({
            username: props.extenalId,
            newPassword: props.newPassword,
            otpCode: OTP_CODE,
            email: props.recoveryMethodValue!,
          })
          .then(() => onSuccess())
          .catch(() => onFailure())
      : phoneResetPasswordMutation
          .mutateAsync({
            username: props.extenalId,
            newPassword: props.newPassword,
            otpCode: OTP_CODE,
            phoneNumber: props.recoveryMethodValue!,
          })
          .then(() => onSuccess())
          .catch(() => onFailure());
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
      <DrawerContent className="min-h-fit h-[50vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Password Reset</DrawerTitle>
          <DrawerDescription>
            Reset you password with the OTP we sent you
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full p-4 h-[50vh]">
          <div className="flex flex-col">
            <span className="font-medium text-md">
              We sent an OTP to&nbsp;
              {shortenString(props?.recoveryMethodValue ?? "", {
                leading: 4,
                trailing: 3,
              })}
            </span>
            <span className="text-sm">Use it to reset your password</span>
          </div>

          <Controller
            control={form.control}
            name="code"
            render={({ field }) => {
              return (
                <div className="mt-3 flex flex-row items-center w-full">
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
                </div>
              );
            }}
          />

          <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
            <ActionButton
              disabled={
                OTP_CODE.length < 4 ||
                requestRecoveryMutation.isPending ||
                phoneResetPasswordMutation.isPending ||
                emailResetPasswordMutation.isPending
              }
              variant="secondary"
              onClick={onResetPassword}
              loading={
                phoneResetPasswordMutation.isPending ||
                emailResetPasswordMutation.isPending
              }
            >
              Reset Password
            </ActionButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
