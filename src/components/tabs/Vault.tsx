import { useEffect, useCallback, useState, JSX } from "react";
import { useLaunchParams, backButton } from "@telegram-apps/sdk-react";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { fetchMyKeys, keyType } from "../../utils/api/keys";
import { useAppDrawer } from "../../hooks/drawer";
import { MySecrets, SharedSecrets } from "../../components/Secrets";
import { WalletBalance } from "../WalletBalance";
import { ResponsiveAppBar } from "../Appbar";
import { Refresh, Add } from "../../assets/icons";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import "../../styles/components/tabs/vault.css";

export const VaultTab = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { openAppDrawer } = useAppDrawer();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [keysLoading, setKeysLoading] = useState<boolean>(false);
  const [mykeys, setMyKeys] = useState<keyType[]>([]);

  const onImportKey = () => {
    openAppDrawer("import");
  };

  const getMyKeys = useCallback(async () => {
    setKeysLoading(true);
    let token: string | null = localStorage.getItem("token");

    const { isOk, keys } = await fetchMyKeys(token as string);

    if (isOk) {
      let parsedkeys: keyType[] = keys.keys.map((_key) => JSON.parse(_key));

      setMyKeys(parsedkeys);
    }

    setKeysLoading(false);
    setRefreshing(true);
  }, []);

  let sharedsecrets = mykeys.filter(
    (_scret) => _scret.type == "foreign" && !_scret?.expired
  );

  useEffect(() => {
    getMyKeys();
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
    }

    if (backButton.isVisible()) {
      backButton.hide();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <ReactPullToRefresh
      onRefresh={getMyKeys}
      pullingContent={
        <div className="refresh_ctr">
          <Refresh width={18} height={19} color={colors.textsecondary} />
        </div>
      }
      refreshingContent={
        <div className="refresh_ctr">
          <Loading />
        </div>
      }
    >
      <section id="vaulttab">
        <ResponsiveAppBar
          username={initData?.user?.username}
          profileImage={initData?.user?.photoUrl}
        />

        <div className="bal-actions">
          <WalletBalance
            refreshing={refreshing}
            setRefreshing={setRefreshing}
          />
        </div>

        <div id="secrets_import">
          <p>Secrets</p>

          <button className="importsecret" onClick={onImportKey}>
            <Add width={28} height={28} color={colors.accent} />
          </button>
        </div>

        <MySecrets keysloading={keysLoading} secretsLs={mykeys} />

        {sharedsecrets.length !== 0 && (
          <SharedSecrets secretsLs={sharedsecrets} />
        )}
      </section>
    </ReactPullToRefresh>
  );
};
