import { Fragment } from "react";
import { toast } from "sonner";
import { shortenString } from "@/lib/utils";

interface Props {
  text: string;
}

export default function ChatMessage({ text }: Props) {
  const linkRegex = /(https?:\/\/[^\s]+)/g;

  const onCopyLink = (part: string) => {
    window.navigator.clipboard.writeText(part);
    toast.success("Link copied to clipboard");
  };

  const formatText = (inputText: string) => {
    const parts = inputText.split(linkRegex);

    return parts.map((part, index) => {
      if (part.match(linkRegex)) {
        return (
          <span
            key={index}
            className="text-accent-primary underline font-medium cursor-pointer"
            onClick={() => onCopyLink(part)}
          >
            {shortenString(part, { leading: 10, trailing: 4 })}
          </span>
        );
      }

      const textWithBreaks = part.split("\n").map((line, i) => (
        <Fragment key={i}>
          {line}
          {i < part.split("\n").length - 1 && <br />}
        </Fragment>
      ));
      return textWithBreaks;
    });
  };

  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {formatText(text)}
    </p>
  );
}
