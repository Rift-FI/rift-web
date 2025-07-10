import React from "react";

interface ChatMessageProps {
  text: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text }) => {
  const linkRegex = /(https?:\/\/[^\s]+)/g;

  const formatText = (inputText: string) => {
    // Split the text by the link regex to separate links and text
    const parts = inputText.split(linkRegex);

    return parts.map((part, index) => {
      if (part.match(linkRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            {part}
          </a>
        );
      }
      // For non-link parts, replace newline characters with <br> tags
      const textWithBreaks = part.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < part.split("\n").length - 1 && <br />}
        </React.Fragment>
      ));
      return textWithBreaks;
    });
  };

  return <p className="whitespace-pre-wrap break-words">{formatText(text)}</p>;
};

export default ChatMessage;
