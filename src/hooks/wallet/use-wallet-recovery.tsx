import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreateRecoveryRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  UpdateRecoveryMethodRequest,
} from "@stratosphere-network/wallet";
import sphere from "@/lib/sphere";

async function createRecovery(args: CreateRecoveryRequest) {
  const res = await sphere.auth.createRecoveryMethods({
    externalId: args.externalId,
    password: args.password,
    emailRecovery: args.emailRecovery,
    phoneRecovery: args.phoneRecovery,
  });

  return res;
}

async function addRecovery(args: UpdateRecoveryMethodRequest) {
  const res = await sphere.auth.updateRecoveryMethod({
    externalId: args.externalId,
    method: args.method,
    password: args.password,
    value: args.value,
  });

  return res;
}

async function requestPasswordReset(args: RequestPasswordResetRequest) {
  const res = await sphere.auth.requestPasswordReset({
    externalId: args.externalId,
    method: args.method,
  });

  return res;
}

async function resetForgotPasswordWithEmail(args: ResetPasswordRequest) {
  const res = await sphere.auth.resetPassword({
    username: args.username,
    newPassword: args.newPassword,
    otpCode: args.otpCode,
    email: args.email!,
  });

  return res;
}

async function resetForgotPasswordWithPhone(args: ResetPasswordRequest) {
  const res = await sphere.auth.resetPassword({
    username: args.username,
    newPassword: args.newPassword,
    otpCode: args.otpCode,
    phoneNumber: args.phoneNumber!,
  });

  return res;
}

async function getRecoveryMethods(args: { externalId: string }) {
  const res = await sphere.auth.getRecoveryOptions(args.externalId);

  return res;
}

export default function useWalletRecovery(args: { externalId?: string }) {
  const createRecoveryMutation = useMutation({ mutationFn: createRecovery });

  const addRecoveryMutation = useMutation({ mutationFn: addRecovery });

  const requestRecoveryMutation = useMutation({
    mutationFn: requestPasswordReset,
  });

  const emailResetPasswordMutation = useMutation({
    mutationFn: resetForgotPasswordWithEmail,
  });

  const phoneResetPasswordMutation = useMutation({
    mutationFn: resetForgotPasswordWithPhone,
  });

  const recoveryMethodsQuery = useQuery({
    queryKey: ["recovery-methods", args.externalId],
    queryFn: () =>
      getRecoveryMethods({ externalId: args.externalId as string }),
  });

  return {
    createRecoveryMutation,
    addRecoveryMutation,
    recoveryMethodsQuery,
    requestRecoveryMutation,
    emailResetPasswordMutation,
    phoneResetPasswordMutation,
  };
}
