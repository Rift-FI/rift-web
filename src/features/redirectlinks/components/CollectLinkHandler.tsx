import { toast } from "sonner";
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import { base64ToString, formatNumberUsd, shortenString } from "@/lib/utils";
import ActionButton from "@/components/ui/action-button";
import useAnalaytics from "@/hooks/use-analytics";

interface Props {
  onDismissDrawer: () => void;
}

export default function CollectLinkHandler(props: Props) {
  const collectobjectb64 = localStorage.getItem("collectobject");
  const { logEvent } = useAnalaytics();

  const collectobject: collectobjectType = JSON.parse(
    base64ToString(collectobjectb64) ?? "{}"
  );

  console.log(collectobject);

  const { data: TOKEN_INFO } = useToken({
    name: collectobject?.token,
    chain: collectobject?.chain,
  });
  const { convertedAmount } = useGeckoPrice({
    amount: Number(collectobject?.amount),
    base: "usd",
    token: TOKEN_INFO?.id,
  });

  const { collectFromOpenSendLink, collectFromSpecificSendLink } =
    usePaymentLinks();

  const onCollectSuccess = () => {
    toast.success(
      `You successfully claimed ${collectobject?.amount} ${collectobject?.token}`
    );
    logEvent("PAYMENT_LINK_CLAIMED");
    props.onDismissDrawer();
  };
  const onCollectFailure = () => {
    toast.warning("We couldn't process your link, please try again");
    props.onDismissDrawer();
  };

  const onCollect = () => {
    if (collectobject?.open) {
      collectFromOpenSendLink
        .mutateAsync({ id: collectobject?.id })
        .then(onCollectSuccess)
        .catch(onCollectFailure);
    } else {
      collectFromSpecificSendLink
        .mutateAsync({ id: collectobject?.id })
        .then(onCollectSuccess)
        .catch(onCollectFailure);
    }
  };

  return (
    <div>
      <p className="text-center">
        You have received crypto via a Sphere link from{" "}
        <span className="font-medium">
          {shortenString(collectobject?.username || "")}
        </span>{" "}
        <br />
        Click <span className="font-medium">"Receive"</span> to transfer them to
        your wallet{" "}
        <span className="font-medium">
          {collectobject?.amount || 0} {collectobject?.token || ""}
        </span>
      </p>

      <div className="border-t border-b border-sidebar-accent mt-6 flex flex-row items-center justify-between py-2">
        <img
          src={TOKEN_INFO?.icon}
          alt={TOKEN_INFO?.name}
          className="w-10 h-10 rounded-full object-contain"
        />

        <p className="flex flex-col items-end justify-end font-medium">
          {collectobject?.amount}
          <span className="font-normal">
            {formatNumberUsd(convertedAmount || 0)}
          </span>
        </p>
      </div>

      <ActionButton
        onClick={onCollect}
        className="mt-10"
        disabled={collectFromOpenSendLink.isPending}
        loading={collectFromOpenSendLink.isPending}
      >
        Receive
      </ActionButton>
    </div>
  );
}

type collectobjectType = {
  intent: "collect";
  id: string;
  amount: string;
  username: string;
  token: string;
  chain: string;
  open?: boolean;
};
