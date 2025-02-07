import { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { fetchMyKeys, getkeysType, keyType } from "../../utils/api/keys";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import { WalletBalance } from "../WalletBalance";
import { MySecrets, SharedSecrets } from "../Secrets";
import { PopOverAlt } from "../global/PopOver";
import { Add, QuickActions, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import airwallex from "../../assets/images/awx.png";
import "../../styles/components/tabs/home.scss";
import { Notification } from "../../assets/icons/tabs";

export const HomeTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [secretsTab, setSecretsTab] = useState<"all" | "me" | "shared">("all");
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLDivElement | null>(
    null
  );

  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });
  const { data: airwallexData } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });

  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys?.map((_key: string) =>
    JSON.parse(_key)
  );
  let userhasawxkey = localStorage.getItem("userhasawxkey");

  const onImportKey = () => {
    navigate("/importsecret");
  };

  const ongoToProfile = () => {
    setProfileAnchorEl(null);
    switchtab("profile");
  };

  const onSwitchToBusiness = () => {
    setProfileAnchorEl(null);

    openAppDialog("loading", "Switching to Stratosphere Business");

    setTimeout(() => {
      closeAppDialog();
      navigate("/business");
    }, 1500);
  };

  const onimportAwx = () => {
    navigate("/importawx");
  };

  let mysecrets = mykeys?.filter((_scret) => _scret.type == "own");
  let sharedsecrets = mykeys?.filter(
    (_scret) => _scret.type == "foreign" && !_scret?.expired
  );
  let claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

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
          <Add width={18} height={18} color={colors.textprimary} />
        </button>
      </div>

      <div className="secret_tabs">
        <button
          onClick={() => setSecretsTab("all")}
          className={secretsTab == "all" ? "select_tab" : ""}
        >
          All ({(mysecrets?.length || 0) + (sharedsecrets?.length || 0)})
        </button>
        <button
          onClick={() => setSecretsTab("me")}
          className={secretsTab == "me" ? "select_tab" : ""}
        >
          My Secrets ({mysecrets?.length || 0})
        </button>
        <button
          onClick={() => setSecretsTab("shared")}
          className={secretsTab == "shared" ? "select_tab" : ""}
        >
          Shared ({sharedsecrets?.length || 0})
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
            width: 36,
            height: 36,
          }}
          onClick={(e) => {
            setProfileAnchorEl(e.currentTarget);
          }}
        />

        <button
          className="notification"
          onClick={() => switchtab("notifications")}
        >
          <Notification
            width={18}
            height={18}
            color={claimedstartairdrop ? colors.textsecondary : colors.danger}
          />
        </button>
      </div>
      <PopOverAlt anchorEl={profileAnchorEl} setAnchorEl={setProfileAnchorEl}>
        {
          <div className="profile_actions">
            <div className="action first" onClick={ongoToProfile}>
              <p>
                My Profile <Stake color={colors.textprimary} />
              </p>
              <span>Visit my profile</span>
            </div>
            <div className="action" onClick={onSwitchToBusiness}>
              <p>
                Business
                <QuickActions
                  width={10}
                  height={10}
                  color={colors.textprimary}
                />
              </p>
              <span>Stratosphere for Businesses</span>
            </div>
          </div>
        }
      </PopOverAlt>

      {airwallexData?.status == 404 && userhasawxkey == null && (
        <div className="airwallex" onClick={onimportAwx}>
          <img src={airwallex} alt="airwallex" />
        </div>
      )}
    </section>
  );
};
