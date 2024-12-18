import { useEffect, useCallback, useState, JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { fetchMyKeys, keyType } from "../../utils/api/keys";
import { useAppDrawer } from "../../hooks/drawer";
import { MySecrets, SharedSecrets } from "../../components/Secrets";
import { WalletBalance } from "../WalletBalance";
import { ResponsiveAppBar } from "../Appbar";
import { Receive, Send, Add } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/tabs/vault.css";

export const VaultTab = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { openAppDrawer } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const [mykeys, setMyKeys] = useState<keyType[]>([]);

  let walletAddress = localStorage.getItem("address");

  const onSend = () => {
    openAppDrawer("sendoptions");
  };

  const onReceive = () => {
    navigator.clipboard.writeText(walletAddress as string);
    showsuccesssnack("Wallet address copied to clipboard");
  };

  const onImportKey = () => {
    openAppDrawer("import");
  };

  const getMyKeys = useCallback(async () => {
    let token: string | null = localStorage.getItem("token");

    const { isOk, keys } = await fetchMyKeys(token as string);

    if (isOk) {
      let parsedkeys: keyType[] = keys.keys.map((_key) => JSON.parse(_key));

      setMyKeys(parsedkeys);
    }
  }, []);

  let sharedsecrets = mykeys.filter((_scret) => _scret.type == "foreign");

  useEffect(() => {
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
        <WalletBalance />

        <div className="actions">
          <button className="send" onClick={onSend}>
            <Send color={colors.accent} />
            <span>Send</span>
          </button>

          <button className="receive" onClick={onReceive}>
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
    </section>
  );
};
