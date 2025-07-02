import { toast } from "sonner";
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import { base64ToString, formatNumberUsd, shortenString } from "@/lib/utils";
import ActionButton from "@/components/ui/action-button";
import { analyticsLog } from "@/analytics/events";
import { usePlatformDetection } from "@/utils/platform";

interface Props {
  onDismissDrawer: () => void;
}

export default function CollectLinkHandler(props: Props) {
  const collectobjectb64 = localStorage.getItem("collectobject");
  const { telegramUser } = usePlatformDetection();

  const collectobject: collectobjectType = JSON.parse(
    base64ToString(collectobjectb64) ?? "{}"
  );

  const { data: TOKEN_INFO } = useToken({
    name: collectobject?.token,
    chain: collectobject?.chain,
  });
  const { convertedAmount } = useGeckoPrice({
    amount: Number(collectobject?.amount),
    base: "usd",
    token: TOKEN_INFO?.id,
  });

  const { collectFromSendLink } = usePaymentLinks();

  const onCollect = async () => {
    try {
      await collectFromSendLink.mutateAsync({ id: collectobject?.id });
      
      // Track successful deposit/collection
      const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
      analyticsLog("DEPOSIT", { telegram_id: telegramId });
      
      toast.success(
        `You successfully claimed ${collectobject?.amount} ${collectobject?.token}`
      );
      // Close drawer after successful collection
      props.onDismissDrawer();
    } catch (err) {
      console.log("error", err);
      toast.warning("We couldn't process your link, please try again");
      // Close drawer even on error
      props.onDismissDrawer();
    }
  };

  return (
    <div>
      <p className="text-center">
        You have received crypto via a Sphere link from{" "}
        <span className="font-semibold">
          {shortenString(collectobject?.username || "")}
        </span>{" "}
        <br />
        Click <span className="font-semibold">"Receive"</span> to transfer them
        to your wallet{" "}
        <span className="font-semibold">
          {collectobject?.amount || 0} {collectobject?.token || ""}
        </span>
      </p>

      <div className="border-t border-b border-sidebar-accent mt-6 flex flex-row items-center justify-between py-2">
        <img
          src={TOKEN_INFO?.icon}
          alt={TOKEN_INFO?.name}
          className="w-10 h-10 rounded-full object-contain"
        />

        <p className="flex flex-col items-end justify-end font-semibold">
          {collectobject?.amount}
          <span className="font-normal">
            {formatNumberUsd(convertedAmount || 0)}
          </span>
        </p>
      </div>

      <ActionButton
        onClick={onCollect}
        className="mt-10"
        disabled={collectFromSendLink.isPending}
        loading={collectFromSendLink.isPending}
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
};
