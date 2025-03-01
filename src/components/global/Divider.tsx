import { CSSProperties, JSX } from "react";
import { colors } from "../../constants";

export const HorizontalDivider = ({
  sxstyles,
}: {
  sxstyles?: CSSProperties;
}): JSX.Element => {
  return (
    <div
      style={{
        width: "100%",
        height: "1px",
        backgroundColor: colors.divider,
        ...sxstyles,
      }}
    />
  );
};

export const VerticalDivider = ({
  sxstyles,
}: {
  sxstyles?: CSSProperties;
}): JSX.Element => {
  return (
    <div
      style={{
        width: "1px",
        height: "100%",
        backgroundColor: colors.divider,
        ...sxstyles,
      }}
    />
  );
};
