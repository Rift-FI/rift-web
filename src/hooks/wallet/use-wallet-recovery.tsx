import { useMutation, useQuery } from "@tanstack/react-query";
import sphere from "@/lib/sphere";

export interface createRecoveryArgs {
  externalId: string;
  password: string;
  emailRecovery?: string;
  phoneRecovery?: string;
}

export interface addRecoveryArgs {
  externalId: string;
  method: "emailRecovery" | "phoneRecovery";
  password: string;
  value: string;
}

async function createRecovery(args: createRecoveryArgs) {
  const res = await sphere.auth.createRecoveryMethods({
    externalId: args.externalId,
    password: args.password,
    emailRecovery: args.emailRecovery,
    phoneRecovery: args.phoneRecovery,
  });

  return res;
}

async function addRecovery(args: addRecoveryArgs) {
  const res = await sphere.auth.updateRecoveryMethod({
    externalId: args.externalId,
    method: args.method,
    password: args.password,
    value: args.value,
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

  const recoveryMethodsQuery = useQuery({
    queryKey: ["recovery-methods", args.externalId],
    queryFn: () =>
      getRecoveryMethods({ externalId: args.externalId as string }),
  });

  return {
    createRecoveryMutation,
    addRecoveryMutation,
    recoveryMethodsQuery,
  };
}
