import { useState, Dispatch, SetStateAction } from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Vault, Market, Labs, Security, Earn } from "../assets/icons";
import { colors } from "../constants";

export type tabsType = "vault" | "market" | "labs" | "security" | "earn";

export const BottomTabNavigation = ({
  setTab,
}: {
  setTab: Dispatch<SetStateAction<tabsType>>;
}) => {
  const [value, setValue] = useState(0);

  return (
    <BottomNavigation
      value={value}
      onChange={(_event, newValue) => setValue(newValue)}
      showLabels
      sx={{
        backgroundColor: colors.primary,
        color: "#ffffff",
        position: "fixed",
        bottom: 0,
        left: 0,
        borderTop: `1px solid ${colors.divider}`,
      }}
    >
      <BottomNavigationAction
        onClick={() => {
          setTab("vault");
        }}
        label="Vault"
        icon={<Vault color={value == 0 ? colors.accent : colors.textprimary} />}
        sx={{ color: colors.textprimary, gap: "0.25rem" }}
        disableTouchRipple
      />

      <BottomNavigationAction
        onClick={() => {
          setTab("market");
        }}
        label="Market"
        icon={
          <Market color={value == 1 ? colors.accent : colors.textprimary} />
        }
        sx={{ color: colors.textprimary, gap: "0.25rem" }}
        disableTouchRipple
      />

      <BottomNavigationAction
        onClick={() => {
          setTab("labs");
        }}
        label="Labs"
        icon={<Labs color={value == 2 ? colors.accent : colors.textprimary} />}
        sx={{ color: colors.textprimary, gap: "0.25rem" }}
        disableTouchRipple
      />

      <BottomNavigationAction
        onClick={() => {
          setTab("security");
        }}
        label="Security"
        icon={
          <Security color={value == 3 ? colors.accent : colors.textprimary} />
        }
        sx={{ color: colors.textprimary, gap: "0.25rem" }}
        disableTouchRipple
      />

      <BottomNavigationAction
        onClick={() => {
          setTab("earn");
        }}
        label="Earn"
        icon={<Earn color={value == 4 ? colors.accent : colors.textprimary} />}
        sx={{ color: colors.textprimary, gap: "0.25rem" }}
        disableTouchRipple
      />
    </BottomNavigation>
  );
};
