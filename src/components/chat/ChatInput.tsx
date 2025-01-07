import { JSX, useState } from "react";
import { Send } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/chat/chatinput.css";

interface props {
  promptLoading: boolean;
  onSubmitPrompt: (userPrompt: string) => void;
}

export const ChatInput = ({
  promptLoading,
  onSubmitPrompt,
}: props): JSX.Element => {
  const [propmtValue, setPropmtValue] = useState<string>("");

  return (
    <div className="chatinput">
      <textarea
        name="message"
        id="message"
        className="promptinput"
        placeholder="message..."
        value={propmtValue}
        onChange={(e) => setPropmtValue(e.target.value)}
      />

      <button
        className="submitprompt"
        disabled={promptLoading || propmtValue == ""}
        onClick={() => {
          setPropmtValue("");
          onSubmitPrompt(propmtValue);
        }}
      >
        <Send
          width={20}
          height={20}
          color={promptLoading ? colors.textsecondary : colors.textprimary}
        />
      </button>
    </div>
  );
};
