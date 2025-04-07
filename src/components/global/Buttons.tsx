import { CSSProperties, JSX, ReactNode } from "react";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";

type buttonProps = {
  text: string;
  icon?: ReactNode;
  sxstyles?: CSSProperties;
  isDisabled?: boolean;
  isLoading?: boolean;
  onclick: () => void;
};

export const SubmitButton = ({
  text,
  icon,
  sxstyles,
  isDisabled,
  isLoading,
  onclick,
}: buttonProps): JSX.Element => {
  return (
    <button
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25rem",
        width: "100%",
        padding: 5,
        border: 0,
        outline: "none",
        outlineColor: "transparent",
        borderRadius: "0.10rem",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: isLoading || isDisabled ? colors.textsecondary : "#0e0e0e",
        backgroundColor: isLoading || isDisabled ? "bg-[#222222]" : "#ffb386",
        ...sxstyles,
      }}
      disabled={isDisabled}
      onClick={onclick}
    >
      {isLoading ? (
        <Loading width="1.5rem" height="1.5rem" />
      ) : (
        <>
          {text} {icon}
        </>
      )}
    </button>
  );
};

export const MantraButton = ({
  text,
  icon,
  sxstyles,
  isDisabled,
  isLoading,
  onclick,
}: buttonProps): JSX.Element => {
  return (
    <button
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25rem",
        width: "100%",
        padding: "0.625rem",
        border: 0,
        outline: "none",
        outlineColor: "transparent",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        fontWeight: "bold",
        color: isLoading || isDisabled ? colors.textsecondary : colors.primary,
        backgroundImage: colors.omgradient,
        ...sxstyles,
      }}
      disabled={isDisabled}
      onClick={onclick}
    >
      {isLoading ? (
        <Loading width="1.5rem" height="1.5rem" />
      ) : (
        <>
          {text} {icon}
        </>
      )}
    </button>
  );
};
