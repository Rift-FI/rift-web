import { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import {
  faExchangeAlt,
  faLayerGroup,
  faCrown,
  faGlobe,
  faFlask,
  faGift,
  faArrowsRotate,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { WalletBalance } from "../WalletBalance";
import { PopOverAlt } from "../global/PopOver";
import { QuickActions } from "../../assets/icons/actions";
import { colors } from "../../constants";
import { Notification } from "../../assets/icons/tabs";
import stratosphere from "../../assets/images/sphere.jpg";
import "../../styles/components/tabs/home.scss";

export const HomeTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const actionButtons = [
    { icon: faGlobe, text: "Web2", screen: "web2" },
    { icon: faLayerGroup, text: "Stake", screen: "staking" },
    { icon: faCrown, text: "Premium", screen: "premiums" },
    { icon: faArrowsRotate, text: "Lend", screen: "lend" },
  ];

  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLDivElement | null>(
    null
  );

  const onSwitchToBusiness = () => {
    setProfileAnchorEl(null);

    openAppDialog("loading", "Switching to Sphere for Business");

    setTimeout(() => {
      closeAppDialog();
      navigate("/business");
    }, 1500);
  };

  const onLabs = () => {
    switchtab("labs");
  };

  const onAirdrops = () => {
    switchtab("rewards");
  };

  const onSwap = () => {
    openTelegramLink("https://t.me/stratospherex_bot/stratospherex");
  };

  const onSendCrypto = () => {
    switchtab("sendcrypto");
  };

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");
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
      <div className="id_actions">
        <div className="sphereid">
          <img src={stratosphere} alt="sphere" />
          <p>
            {ethAddr?.substring(2, 6)}
            {btcAddr?.substring(2, 6)}
          </p>
        </div>

        <div className="avatrctr">
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
        </div>
      </div>
      <PopOverAlt anchorEl={profileAnchorEl} setAnchorEl={setProfileAnchorEl}>
        {
          <div className="profile_actions">
            <div className="description">
              <p>
                Sphere for Businesses
                <span>The Sphere Business Suite</span>
              </p>
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
              <span>Switch to Sphere for Businesses</span>
            </div>
          </div>
        }
      </PopOverAlt>

      <WalletBalance />

      <div className="actions">
        <div className="_action" onClick={onSendCrypto}>
          <span>Send</span>

          <span className="icons">
            <FontAwesomeIcon icon={faChevronRight} className="icon" />
          </span>
        </div>

        <div className="_action" onClick={onAirdrops}>
          <span>Airdrops</span>

          <span className="icons">
            <FontAwesomeIcon icon={faGift} className="icon" />
          </span>
        </div>

        <div className="_action" onClick={onLabs}>
          <span>Labs</span>

          <span className="icons">
            <FontAwesomeIcon icon={faFlask} className="icon" />
          </span>
        </div>

        <div className="_action" onClick={onSwap}>
          <span>Swap</span>

          <span className="icons">
            <FontAwesomeIcon icon={faExchangeAlt} className="icon" />
          </span>
        </div>

        {actionButtons.map((btn, index) => (
          <div
            key={index}
            className="_action"
            onClick={() => {
              if (btn?.screen) {
                navigate(`/${btn?.screen}`);
              }
            }}
          >
            <span>{btn.text}</span>
            <span className="icons">
              <FontAwesomeIcon icon={btn.icon} className="icon" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
