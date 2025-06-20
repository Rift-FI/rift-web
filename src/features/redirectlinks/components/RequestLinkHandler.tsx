import ActionButton from "@/components/ui/action-button";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useToken from "@/hooks/data/use-token";
import { formatNumberUsd, shortenString } from "@/lib/utils";
import { toast } from "sonner";
import { base64ToString } from "@/lib/utils";
import usePaymentLinks from "@/hooks/data/use-payment-link";

interface Props {
  onDismissDrawer: () => void;
}

export default function RequestLinkHandler(props: Props) {
  const requestobjectb64 = localStorage.getItem("requestobject");
  const requestobject: requestobjectType = JSON.parse(
    base64ToString(requestobjectb64) ?? ""
  );

  const { data: TOKEN_INFO } = useToken({
    name: requestobject.token,
    chain: requestobject.chain,
  });
  const { convertedAmount } = useGeckoPrice({
    amount: Number(requestobject.amount),
    base: "usd",
    token: TOKEN_INFO?.id,
  });

  const { payRequestPaymentLink } = usePaymentLinks();

  const onReceive = () => {
    payRequestPaymentLink
      .mutateAsync({ nonce: requestobject.id })
      .then(() => {
        toast.success(
          `You successfully paid ${requestobject.amount} ${requestobject.token}`
        );
        props.onDismissDrawer();
      })
      .catch(() => {
        toast.warning(
          "We couldn't process the payment request, please try again"
        );
      });
  };

  return (
    <div>
      <p className="text-center">
        You received a payment request <br />
        Click <span className="font-semibold">"Pay Now"</span> to pay{" "}
        <span className="font-semibold">
          {requestobject.amount} {requestobject.token}
        </span>{" "}
        to{" "}
        <span className="font-semibold">
          {shortenString(requestobject.username)}
        </span>
      </p>

      <div className="border-t border-b border-sidebar-accent mt-6 flex flex-row items-center justify-between py-2">
        <img
          src={TOKEN_INFO?.icon}
          alt={TOKEN_INFO?.name}
          className="w-10 h-10 rounded-full object-contain"
        />

        <p className="flex flex-col items-end justify-end font-semibold">
          {requestobject.amount}
          <span className="font-normal">
            {formatNumberUsd(convertedAmount || 0)}
          </span>
        </p>
      </div>

      <ActionButton onClick={onReceive} className="mt-10">
        Pay Now
      </ActionButton>
    </div>
  );
}

type requestobjectType = {
  intent: "request";
  id: string;
  amount: 2;
  username: string;
  chain: string;
  token: string;
};
