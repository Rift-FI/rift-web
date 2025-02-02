import { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTabs } from "../../hooks/tabs";
import { fetchMyKeys, getkeysType, keyType } from "../../utils/api/keys";
import { MySecrets, SharedSecrets } from "../Secrets";
import { WalletBalance } from "../WalletBalance";
import { Add } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/tabs/home.scss";

export const HomeTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");

  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });
  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys.map((_key: string) => JSON.parse(_key));

  const onImportKey = () => {
    navigate("/importsecret");
  };

  let mysecrets = mykeys?.filter((_scret) => _scret.type == "own");
  let sharedsecrets = mykeys?.filter(
    (_scret) => _scret.type == "foreign" && !_scret?.expired
  );

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
    <section id="hometab">
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
          All ({mysecrets?.length + sharedsecrets?.length})
        </button>
        <button
          onClick={() => setSecretsTab("me")}
          className={secretsTab == "me" ? "select_tab" : ""}
        >
          My Secrets ({mysecrets?.length})
        </button>
        <button
          onClick={() => setSecretsTab("shared")}
          className={secretsTab == "shared" ? "select_tab" : ""}
        >
          Shared ({sharedsecrets?.length})
        </button>
      </div>

      {secretsTab == "all" &&
        mysecrets?.length == 0 &&
        sharedsecrets?.length == 0 && (
          <p className="nokeys">All your imported secrets and shared secrets</p>
        )}
      {secretsTab == "all" && mysecrets?.length > 0 && (
        <MySecrets secretsLs={mykeys} />
      )}
      {secretsTab == "all" && sharedsecrets?.length > 0 && <br />}

      {secretsTab == "all" && sharedsecrets?.length > 0 && (
        <SharedSecrets
          sx={{ marginTop: "-0.75rem" }}
          secretsLs={sharedsecrets}
        />
      )}

      {secretsTab == "me" &&
        (mysecrets?.length > 0 ? (
          <MySecrets secretsLs={mykeys} />
        ) : (
          <p className="nokeys">
            Import Your Keys & Secrets to see them listed here <br />
            You can also share your keys
          </p>
        ))}

      {secretsTab == "shared" &&
        (sharedsecrets?.length > 0 ? (
          <SharedSecrets secretsLs={sharedsecrets} />
        ) : (
          <p className="nokeys">
            Keys and secrets you receive appear here <br /> Expired secrets will
            not be shown
          </p>
        ))}

      <div className="avatrctr">
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
  );
};
