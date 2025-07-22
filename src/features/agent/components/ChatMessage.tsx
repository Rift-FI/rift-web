import { shortenString } from "@/lib/utils";
import { Fragment } from "react";

interface Props {
  text: string;
}

export default function ChatMessage({ text }: Props) {
  const linkRegex = /(https?:\/\/[^\s]+)/g;

  const formatText = (inputText: string) => {
    const parts = inputText.split(linkRegex);

    return parts.map((part, index) => {
      if (part.match(linkRegex)) {
        return (
          <span
            key={index}
            className="text-accent-primary underline font-medium"
            onClick={() => window.navigator.clipboard.writeText(part)}
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
