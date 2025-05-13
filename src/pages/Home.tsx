import { JSX, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { tabsType, useTabs } from "../hooks/tabs";
import { useAppDrawer } from "../hooks/drawer";
import { checkServerStatus } from "../utils/api/apistatus";
import { BottomTabNavigation } from "../components/Bottom";
import { HomeTab } from "../components/tabs/HomeTab";
import { KeysTab } from "../components/tabs/KeysTab";
import { Rewards } from "../components/tabs/Rewards";
import { Polymarket } from "../components/tabs/Polymarket";

export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const { openAppDrawer } = useAppDrawer();
  const { switchtab, currTab } = useTabs();

  const checkAccessUser = useCallback(async () => {
    const ethaddress: string | null = localStorage.getItem("ethaddress");
    const authtoken: string | null = localStorage.getItem("spheretoken");
    const authsessionversion: string | null = localStorage.getItem(
      "auth_session_version"
    );

    // airdrop id
    const airdropId = localStorage.getItem("airdropId");

    // start tab/page from miniapp
    const starttab = localStorage.getItem("starttab");
    const startpage = localStorage.getItem("startpage");

    // collect link id & value
    const utxoId = localStorage.getItem("utxoId");
    const utxoVal = localStorage.getItem("utxoVal");

    // paid key/secret values
    const paysecretnonce = localStorage.getItem("paysecretnonce");

    if (
      ethaddress == null ||
      typeof ethaddress == undefined ||
      authtoken == null ||
      typeof authtoken == undefined ||
      authsessionversion == null ||
      typeof authsessionversion == undefined
    ) {
      navigate("/auth");
      return;
    }

    if (starttab !== null) {
      const tab = starttab as string as tabsType;
      switchtab(tab);
    }

    if (startpage !== null) {
      navigate(`/${startpage}`);
      return;
    }

    if (airdropId !== null) {
      switchtab("rewards");
      return;
    }

    if (paysecretnonce !== null) {
      navigate("/claimlendkey");
      return;
    }

    if (utxoId !== null && utxoVal !== null) {
      openAppDrawer("collectfromwallet");
      return;
    }
  }, []);

  useQuery({
    queryKey: ["serverstatus"],
    refetchInterval: 5000,
    queryFn: () =>
      checkServerStatus()
        .then((res) => {
          if (res?.status !== 200) {
            navigate("/server-error");
          }
        })
        .catch(() => {
          navigate("/server-error");
        }),
  });

  useEffect(() => {
    checkAccessUser();
  }, []);

  return (
    <section>
      {currTab == "home" ? (
        <HomeTab />
      ) : currTab == "keys" ? (
        <KeysTab />
      ) : currTab == "rewards" ? (
        <Rewards />
      ) : (
        <Polymarket />
      )}

      <BottomTabNavigation />
    </section>
  );
}
