import { useEffect, useCallback, useState, JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { fetchMyKeys, keyType } from "../../utils/api/keys";
import { walletBalance } from "../../utils/api/wallet";
import { AppDrawer, draweraction } from "../../components/global/AppDrawer";
import { MySecrets, SharedSecrets } from "../../components/Secrets";
import { WalletBalance } from "../WalletBalance";
import { ResponsiveAppBar } from "../Appbar";
import { Receive, Send, Share, Add } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/tabs/vault.css";

export const VaultTab = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [appDrawerOpen, setAppDrawerOpen] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number>(0.0);
  const [mykeys, setMyKeys] = useState<keyType[]>([]);
  const [action, setAction] = useState<draweraction>("send");

  let walletAddress = localStorage.getItem("address");

  const onSend = () => {
    setAction("send");
    setAppDrawerOpen(true);
  };

  const onShare = () => {
    setAction("share");
    setAppDrawerOpen(true);
  };

  const onCopyAddr = () => {
    navigator.clipboard.writeText(walletAddress as string);
    showsuccesssnack("Wallet address copied to clipboard");
  };

  const onImportKey = () => {
    setAction("import");
    setAppDrawerOpen(true);
  };

  const getMyKeys = useCallback(async () => {
    let token: string | null = localStorage.getItem("token");

    const { isOk, keys } = await fetchMyKeys(token as string);

    if (isOk) {
      let parsedkeys: keyType[] = keys.keys.map((_key) => JSON.parse(_key));

      setMyKeys(parsedkeys);
    } else {
      showerrorsnack("Unable to get your keys");
    }
  }, []);

  const getWalletBalance = useCallback(async () => {
    let access: string | null = localStorage.getItem("token");

    const { balance } = await walletBalance(access as string);
    setAccBalance(Number(balance));
  }, []);

  let sharedsecrets = mykeys.filter((_scret) => _scret.type == "foreign");

  useEffect(() => {
    getWalletBalance();
    getMyKeys();
  }, []);

  return (
    <section id="vaulttab">
      <ResponsiveAppBar
        username={initData?.user?.username}
        profileImage={initData?.user?.photoUrl}
        walletAddress={walletAddress as string}
      />

      <div className="bal-actions">
        <WalletBalance balInEth={accBalance} />

        <div className="actions">
          <button className="send" onClick={onSend}>
            <Send color={colors.accent} />
            <span>Send</span>
          </button>

          <button className="receive" onClick={onCopyAddr}>
            <Receive color={colors.success} />
            <span>Receive</span>
          </button>
        </div>
      </div>

      <div id="secrets_import">
        <p>Secrets</p>

        <button className="importsecret" onClick={onImportKey}>
          <Add width={28} height={28} color={colors.accent} />
        </button>
      </div>

      {mykeys.length !== 0 && <MySecrets secretsLs={mykeys} />}

      {sharedsecrets.length !== 0 && (
        <SharedSecrets secretsLs={sharedsecrets} />
      )}

      <button id="share" onClick={onShare}>
        <Share width={16} height={18} color={colors.danger} />
      </button>

      <AppDrawer
        action={action}
        drawerOpen={appDrawerOpen}
        setDrawerOpen={setAppDrawerOpen}
      />
    </section>
  );
};
