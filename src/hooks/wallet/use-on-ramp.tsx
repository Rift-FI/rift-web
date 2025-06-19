import { useMutation, useQuery } from "@tanstack/react-query";
import {
  MpesaSTKInitiateRequest,
  MpesaSTKInitiateResponse,
} from "@stratosphere-network/wallet";
import sphere from "@/lib/sphere";

interface UseOnRampParams {
  tx_args?: MpesaSTKInitiateRequest;
  onSuccess?: (ONRAMP_RES: MpesaSTKInitiateResponse) => void;
  onError?: () => void;
  checkoutRequestId?: string;
  merchantId?: string;
  enableStatusPolling?: boolean;
}

function getUsdExchangeRate() {
  return 136;
}

export default function useOnRamp(params: UseOnRampParams = {}) {
  const {
    tx_args,
    onSuccess,
    onError,
    checkoutRequestId,
    merchantId,
    enableStatusPolling = true,
  } = params;

  const onRampMutation = useMutation({
    mutationFn: async (args: MpesaSTKInitiateRequest) => {
      const res = await sphere.onramp.initiateSafaricomSTK(args);
      if (res?.success) {
        onSuccess?.(res);
      } else {
        onError?.();
      }
      return res;
    },
    onError: () => {
      onError?.();
    },
  });

  const onRampStatusQuery = useQuery({
    queryKey: ["onrampstatus", checkoutRequestId],
    queryFn: async () =>
      await sphere.onramp.pollSafaricomTransactionStatus(checkoutRequestId),
    enabled: !!(checkoutRequestId && enableStatusPolling),
    refetchInterval: enableStatusPolling ? 3000 : false,
    refetchIntervalInBackground: true,
    retry: false,
  });

  return {
    onRampMutation,
    onRampStatusQuery,
    USD_EXCHANGE_RATE: getUsdExchangeRate(),
  };
}
