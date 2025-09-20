import { useMutation } from "@tanstack/react-query";
import useWalletAuth from "../wallet/use-wallet-auth";

interface VerifyExternalIdArgs {
  password: string;
}

async function verifyExternalIdAuth(
  externalId: string,
  args: VerifyExternalIdArgs
): Promise<boolean> {
  const { password } = args;
  if (!externalId) throw new Error("External ID not found");
  if (!password) throw new Error("Password is required");

  // Note: This would typically verify against backend, but for now we'll assume success
  // In real implementation, this would make an API call to verify credentials
  console.log("Verifying external ID auth for:", externalId);

  // TODO: Implement actual verification call when backend supports it
  // const response = await rift.auth.verifyCredentials({
  //   externalId: externalId,
  //   password: password,
  // });

  return true;
}

export default function useExternalIdAuth() {
  const { userQuery } = useWalletAuth();
  const userExternalId =
    userQuery?.data?.externalId || localStorage.getItem("externalId");

  const verifyExternalIdMutation = useMutation({
    mutationFn: async (args: VerifyExternalIdArgs) => {
      return verifyExternalIdAuth(userExternalId!, args);
    },
  });

  return {
    verifyExternalIdMutation,
    userExternalId,
  };
}
