import { useEffect, useCallback, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { fetchMyKeys, keyType } from "../../utils/api/keys";
import { MySecrets, SharedSecrets } from "../../components/Secrets";
import { WalletBalance } from "../WalletBalance";
import { Refresh, Add } from "../../assets/icons";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import "../../styles/components/tabs/vault.css";

// home
export const VaultTab = (): JSX.Element => {
  const navigate = useNavigate();

  const [_refreshing, setRefreshing] = useState<boolean>(false);
  const [mykeys, setMyKeys] = useState<keyType[]>([]);
  const [secretsTab, setSecretsTab] = useState<"me" | "shared">("me");

  const onImportKey = () => {
    navigate("/importsecret");
  };

  const getMyKeys = useCallback(async () => {
    let token: string | null = localStorage.getItem("token");

    const { isOk, keys } = await fetchMyKeys(token as string);

    if (isOk) {
      let parsedkeys: keyType[] = keys.keys.map((_key) => JSON.parse(_key));

      setMyKeys(parsedkeys);
    }

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
        <WalletBalance />

        <div id="secrets_import">
          <p>Secrets</p>

          <button className="importsecret" onClick={onImportKey}>
            <Add color={colors.textprimary} />
          </button>
        </div>

        <div className="secret_tabs">
          <button
            onClick={() => setSecretsTab("me")}
            className={secretsTab == "me" ? "select_tab" : ""}
          >
            My Secrets
          </button>
          <button
            onClick={() => setSecretsTab("shared")}
            className={secretsTab == "shared" ? "select_tab" : ""}
          >
            Shared Secrets
          </button>
        </div>

        {secretsTab == "me" &&
          (mykeys.length > 0 ? (
            <MySecrets secretsLs={mykeys} />
          ) : (
            <p className="nokeys">
              Import Your Keys & Secrets to see them listed here <br />
              You can also share your keys
            </p>
          ))}

        {secretsTab == "shared" &&
          (sharedsecrets.length > 0 ? (
            <SharedSecrets secretsLs={sharedsecrets} />
          ) : (
            <p className="nokeys">
              Keys and secrets you receive appear here <br /> Expired secrets
              will not be shown
            </p>
          ))}
      </section>
    </ReactPullToRefresh>
  );
};
