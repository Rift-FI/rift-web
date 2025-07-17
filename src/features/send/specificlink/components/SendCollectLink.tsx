import { openTelegramLink } from "@telegram-apps/sdk-react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { FaTelegram } from "react-icons/fa6";
import { usePlatformDetection } from "@/utils/platform";
import ActionButton from "@/components/ui/action-button";
import { useSendContext } from "../../context";
import { shortenString } from "@/lib/utils";

interface Props {
  link: string;
}

export default function SendCollectLink({ link }: Props) {
  const { isTelegram } = usePlatformDetection();
  const { state } = useSendContext();

  const SEND_MODE = state?.getValues("mode");
  const LINK_RECIPIENT = state?.getValues("recipient");

  const handleCopy = () => {
    window.navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const onShareTg = () => {
    if (isTelegram) {
      openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}`
      );
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-4">
      <p className="text-center font-semibold">
        Your link was created successfully <br />
        <span className="text-md font-light text-sm">
          Copy & share it with{" "}
          {SEND_MODE == "send-open-link"
            ? "the intended recipient"
            : shortenString(LINK_RECIPIENT!, { trailing: 3 })}
        </span>
      </p>

      <div
        onClick={handleCopy}
        className="p-1 pl-2 w-full flex flex-row items-center justify-between cursor-pointer border-1 border-border rounded-[0.625rem]"
      >
        <span className="text-muted-foreground text-ellipsis line-clamp-1 font-semibold">
          {link ?? "Creating a link for you..."}
        </span>
        <div className="p-3 h-full items-center bg-accent rounded-md">
          <Copy className="w-4 h-4" />
        </div>
      </div>

      <ActionButton
        onClick={onShareTg}
        className="p-[0.625rem] rounded-[0.625rem] bg-accent-secondary text-md text-app-background"
      >
        Share on Telegram
        <FaTelegram className="w-5 h-5" />
      </ActionButton>
    </div>
  );
}
