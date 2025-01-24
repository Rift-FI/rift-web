import { CSSProperties, Dispatch, JSX, ReactNode, SetStateAction } from "react";
import { Popover } from "@mui/material";
import { colors } from "../../constants";

interface props {
  children: ReactNode;
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
}

export const PopOver = ({
  children,
  anchorEl,
  setAnchorEl,
}: props): JSX.Element => {
  const popOverOPen = Boolean(anchorEl);
  const popOverId = popOverOPen ? "generic-popover" : undefined;

  const onClose = () => {
    setAnchorEl(null);
  };

  return (
    <Popover
      id={popOverId}
      open={popOverOPen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      elevation={0}
      slotProps={{
        paper: { style: popOverStyles },
      }}
    >
      {children}
    </Popover>
  );
};

const popOverStyles: CSSProperties = {
  width: "100%",
  height: "13.375rem",
  marginTop: 6,
  border: `1px solid ${colors.divider}`,
  borderRadius: "0.5rem",
  backgroundColor: colors.primary,
};
