import { useEffect, useCallback, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { fetchMyKeys, keyType } from "../../utils/api/keys";
import { MySecrets, SharedSecrets } from "../../components/Secrets";
import { WalletBalance } from "../WalletBalance";
import { Refresh, Add } from "../../assets/icons";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import "../../styles/components/tabs/vault.css";

// home
export const VaultTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { currTab, switchtab } = useTabs();

  const [_refreshing, setRefreshing] = useState<boolean>(false);
  const [mykeys, setMyKeys] = useState<keyType[]>([]);
  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

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

  let mysecrets = mykeys.filter((_scret) => _scret.type == "own");
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
            onClick={() => setSecretsTab("all")}
            className={secretsTab == "all" ? "select_tab" : ""}
          >
            All ({mysecrets.length + sharedsecrets.length})
          </button>
          <button
            onClick={() => setSecretsTab("me")}
            className={secretsTab == "me" ? "select_tab" : ""}
          >
            My Secrets ({mysecrets.length})
          </button>
          <button
            onClick={() => setSecretsTab("shared")}
            className={secretsTab == "shared" ? "select_tab" : ""}
          >
            Shared ({sharedsecrets.length})
          </button>
        </div>

        {secretsTab == "all" &&
          mysecrets.length == 0 &&
          sharedsecrets.length == 0 && (
            <p className="nokeys">
              All your imported secrets and shared secrets
            </p>
          )}
        {secretsTab == "all" && mysecrets.length > 0 && (
          <MySecrets secretsLs={mykeys} />
        )}
        {secretsTab == "all" && sharedsecrets.length > 0 && <br />}

        {secretsTab == "all" && sharedsecrets.length > 0 && (
          <SharedSecrets
            sx={{ marginTop: "-0.75rem" }}
            secretsLs={sharedsecrets}
          />
        )}

        {secretsTab == "me" &&
          (mysecrets.length > 0 ? (
            <MySecrets secretsLs={mykeys} />
          ) : (
            <div className="">
              <p className="nokeys">
                Import Your Keys & Secrets to see them listed here <br />
                You can also share your keys.
              </p>
            </div>
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

        <div
          style={{
            border:
              currTab == "profile"
                ? `1px solid ${colors.textsecondary}`
                : `1px solid ${colors.primary}`,
          }}
          className="avatrctr"
        >
          <Avatar
            src={initData?.user?.photoUrl}
            alt={initData?.user?.username}
            sx={{
              width: 32,
              height: 32,
            }}
            onClick={() => {
              switchtab("profile");
            }}
          />
        </div>
      </section>
    </ReactPullToRefresh>
  );
};
