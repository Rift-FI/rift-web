import { ReactNode, useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
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
import { usePlatformDetection } from "@/utils/platform";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { shortenString } from "@/lib/utils";

const resetPasswordSchema = z.object({
  externalId: z.string().min(3, "Username must be at least 3 characters"),
  newpassword: z.string().min(8, "Use a password longer than 8 characters"),
});

type RESET_PASSWORD_SCHEMA_TYPE = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const flow = useFlow();
  const disclosure = useDisclosure();
  const { isTelegram, telegramUser } = usePlatformDetection();

  const resetPasswordForm = useForm<RESET_PASSWORD_SCHEMA_TYPE>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      externalId: "",
      newpassword: "",
    },
  });

  const EXTERNAL_ID = resetPasswordForm.watch("externalId");
  const PASSWORD = resetPasswordForm.watch("newpassword");

  return (
    <div className="flex flex-col w-full h-full p-5 pb-10">
      <div
        className="flex flex-row items-center gap-1 cursor-pointer"
        onClick={() => flow.gotBack("login-username-password")}
      >
        <ArrowLeft />
        <p className="font-semibold text-lg">Go Back</p>
      </div>

      <div className="mt-4">
        <Controller
          control={resetPasswordForm.control}
          name="externalId"
          render={({ field, fieldState }) => {
            return (
              <div className="w-full">
                <input
                  className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                  placeholder="Username"
                  type="text"
                  {...field}
                />
              </div>
            );
          }}
        />

        <Controller
          control={resetPasswordForm.control}
          name="newpassword"
          render={({ field, fieldState }) => {
            return (
              <div className="w-full mt-4">
                <input
                  className="w-full flex flex-row items-center placeholder:font-semibold placeholder:text-lg outline-none bg-accent rounded-md px-2 py-3"
                  placeholder="New Password"
                  type="password"
                  {...field}
                />
              </div>
            );
          }}
        />
      </div>

      {isTelegram && (
        <div className="mt-3">
          <button
            onClick={() =>
              resetPasswordForm.setValue("externalId", String(telegramUser?.id))
            }
            className="flex flex-row items-center justify-start p-2 px-4 mb-2 rounded-full bg-secondary cursor-pointer hover:bg-surface-subtle transition-colors"
          >
            <span className="text-sm font-bold">Use My Telegram ID</span>
          </button>
        </div>
      )}

      <RequestPasswordReset
        {...disclosure}
        extenalId={EXTERNAL_ID!}
        newPassword={PASSWORD!}
        renderTrigger={() => (
          <ActionButton
            variant={"secondary"}
            disabled={EXTERNAL_ID == "" || PASSWORD == ""}
            className="fixed w-auto bottom-4 left-4 right-4"
          >
            <p className="text-white text-xl">Reset Password</p>
          </ActionButton>
        )}
      />
    </div>
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
      <DrawerContent className="h-[40vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Password Reset</DrawerTitle>
          <DrawerDescription className="hidden">
            Request Password Reset - OTP
          </DrawerDescription>
        </DrawerHeader>
        <div className="w-full h-full p-4">
          <p className="text-lg font-semibold">
            Request Password Reset <br />
            <span className="text-sm font-medium">
              We will send you an OTP to reset your password
            </span>
          </p>

          {recoveryMethodsQuery.data?.recoveryOptions?.email == null &&
            recoveryMethodsQuery.data?.recoveryOptions?.phone == null && (
              <p className="mt-10 text-center">
                You need to setup an account recovery method to change your
                password <br /> You can add a recovery method in your profile
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
    toast.success("Your password was reset successfully");
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
      <DrawerContent className="h-[40vh]">
        <DrawerHeader>
          <DrawerTitle className="hidden">Password Reset</DrawerTitle>
          <DrawerDescription className="hidden">
            Reset you password with the OTP we sent you
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full h-full p-4">
          <p className="text-lg font-semibold">
            We sent you an OTP on&nbsp;
            {shortenString(props?.recoveryMethodValue ?? "", {
              leading: 3,
              trailing: 2,
            })}
            <br />
            <span className="text-sm font-medium">
              Use it to reset your password
            </span>
          </p>

          <Controller
            control={form.control}
            name="code"
            render={({ field }) => {
              return (
                <div className="w-full flex flex-col gap-3 ">
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

                  <ActionButton
                    disabled={
                      OTP_CODE.length < 4 ||
                      requestRecoveryMutation.isPending ||
                      phoneResetPasswordMutation.isPending ||
                      emailResetPasswordMutation.isPending
                    }
                    variant={"secondary"}
                    className="mt-6"
                    onClick={onResetPassword}
                    loading={
                      phoneResetPasswordMutation.isPending ||
                      emailResetPasswordMutation.isPending
                    }
                  >
                    <p className=" text-white font-semibold text-xl">
                      Reset Password
                    </p>
                  </ActionButton>
                </div>
              );
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
