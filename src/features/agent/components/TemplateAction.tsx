import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  islast: boolean;
  onclick: (text: string) => void;
}

export default function TemplateAction({ text, islast, onclick }: Props) {
  return (
    <div
      onClick={() => onclick(text)}
      className={cn(
        "flex flex-row items-center justify-between w-full py-[0.625rem] bg-transparent rounded-none border-b-1 border-surface-subtle",
        islast && "border-0"
      )}
    >
      <span className="text-sm text-text-subtle font-[400]">{text}...</span>

      <IoChatbubbleEllipsesOutline className="text-text-subtle" />
    </div>
  );
}
