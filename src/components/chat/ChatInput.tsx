import { JSX, useState } from "react";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/components/chat/chatinput.scss";

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
        placeholder="Ask me anything..."
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
        <FaIcon
          faIcon={faPaperPlane}
          color={
            propmtValue == "" || promptLoading ? colors.divider : colors.accent
          }
          fontsize={18}
        />
      </button>
    </div>
  );
};
