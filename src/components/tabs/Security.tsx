import { CSSProperties, JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../global/Buttons";
import { MiniMap } from "../security/MiniMap";
import { AltNodes } from "./security/Nodes";
import { HorizontalDivider } from "../global/Divider";
import { colors } from "../../constants";
import { ChevronLeft, Import, Lock, Refresh } from "../../assets/icons/actions";
import { Locations } from "../../pages/security/NodesTeeSelector";
import { Security } from "../../assets/icons/tabs";
import nodestees from "../../components/tabs/security/nodestees.json";
import getpremium from "../../assets/images/icons/premium.png";
import "../../styles/components/tabs/security.scss";

export const SecurityTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [keysVisible, setKeysVisible] = useState<"btc" | "eth" | "web2">("btc");

  let btcbal = localStorage.getItem("btcbal");
  let btcbalUsd = localStorage.getItem("btcbalUsd");
  let ethbal = localStorage.getItem("ethbal");
  let ethbalUsd = localStorage.getItem("ethbalUsd");

  const goBack = () => {
    switchtab("home");
  };

  const onGetPremium = () => {
    navigate("/premiums");
  };

  const goToAboutSecurity = () => {
    navigate("/security/info");
  };

  useBackButton(goBack);

  return (
    <section id="securitytab">
      <p className="title">
        Your Wallet Security
        <span className="desc">Free Plan</span>
      </p>

      <div className="keylocactions">
        <p className="keysloctitle">Your Keys are located here</p>

        <div className="actions">
          <SubmitButton
            text="Bitcoin Key"
            sxstyles={{
              backgroundColor:
                keysVisible !== "btc" ? colors.divider : colors.accent,
              ...buttonStyles,
            }}
            onclick={() => setKeysVisible("btc")}
          />
          <SubmitButton
            text="Ethereum Key"
            sxstyles={{
              backgroundColor:
                keysVisible !== "eth" ? colors.divider : colors.accent,
              ...buttonStyles,
            }}
            onclick={() => setKeysVisible("eth")}
          />
          <SubmitButton
            text="Web2 Key(s)"
            sxstyles={{
              backgroundColor:
                keysVisible !== "web2" ? colors.divider : colors.accent,
              ...buttonStyles,
            }}
            onclick={() => setKeysVisible("web2")}
          />
        </div>

        <div className="keysplitmsg">
          <p className="shards">
            Your key is split into <span>4 encrypted shards</span>, each stored
            by a different organization for ultimate security.
          </p>

          <p className="learnmore" onClick={goToAboutSecurity}>
            Learn how this protects you
            <span className="chevron">
              <ChevronLeft width={6} height={11} color={colors.accent} />
            </span>
          </p>
        </div>

        <div className="currkeysvalue">
          <div className="value_ctr">
            <span className="icon">
              <Import width={18} height={18} color={colors.accent} />
            </span>

            <p>
              Current Key Value
              <span className="keyqty">
                {keysVisible == "btc"
                  ? formatNumber(Number(btcbal))
                  : keysVisible == "eth"
                  ? formatNumber(Number(ethbal))
                  : "12 Credentials"}
                {keysVisible !== "web2" && keysVisible}
                <em className="usdval">
                  (
                  {keysVisible == "btc"
                    ? formatUsd(Number(btcbalUsd))
                    : keysVisible == "eth"
                    ? formatUsd(Number(ethbalUsd))
                    : "High Value"}
                  )
                </em>
              </span>
            </p>
          </div>

          {keysVisible !== "web2" && (
            <span className="percentchange">
              {keysVisible == "btc"
                ? "+0.8%"
                : keysVisible == "eth"
                ? "+2.4%"
                : ""}
            </span>
          )}
        </div>
      </div>

      <div className="map_nodelocationsctr">
        <MiniMap
          selectorLocations={Locations.filter(
            (_loc) => _loc?.isNode && _loc?.isAvailable
          ).slice(0, 4)}
        />

        <div className="node_locations">
          <AltNodes
            sxstyles={{
              backgroundColor: "#1F9470",
            }}
            selectedNode={nodestees?.NODES[0]}
            aumvalue={24}
          />
          <AltNodes
            sxstyles={{
              backgroundImage: colors.omgradient,
            }}
            selectedNode={nodestees?.NODES[2]}
            aumvalue={18}
          />
          <AltNodes
            sxstyles={{
              backgroundColor: "rgb(5, 11, 23)",
            }}
            selectedNode={nodestees?.NODES[3]}
            aumvalue={31}
          />
          <AltNodes
            sxstyles={{
              backgroundColor: "#0c0c0e",
            }}
            selectedNode={nodestees?.NODES[4]}
            aumvalue={22}
          />
        </div>

        <MigrateKeys />

        <div className="nodesstatus">
          <SecurityScore />
          <SecurityAudit />
          <ActiveNodesCount />
        </div>
      </div>

      <div className="recovery_settings">
        <p className="recoverytitle">Recovery Options</p>
        <RecoveryOption
          title="Email recovery"
          description="Via your verified email"
          value="enabled"
          onclick={() => {}}
        />
        <HorizontalDivider sxstyles={{ marginTop: "0.75rem" }} />
        <RecoveryOption
          title="Face-to-face recovery"
          description="3 of 4 nodes required"
          value="premium"
          onclick={() => {}}
        />
        <HorizontalDivider sxstyles={{ marginTop: "0.75rem" }} />
        <CustomiseMessage message="Additional recovery methods with Premium" />
      </div>

      <div className="security_settings">
        <p className="settingstitle">Security Settings</p>

        <SecuritySettings
          title="Daily outgoing limit"
          description="Maximum sending amount per 24 hours"
          limitvalue={5000}
          onclick={() => {}}
        />
        <HorizontalDivider sxstyles={{ marginTop: "0.75rem" }} />
        <SecuritySettings
          title="Verification threshold"
          description="Transactions above this amount require 2FA"
          limitvalue={1000}
          onclick={() => {}}
        />
        <HorizontalDivider sxstyles={{ marginTop: "0.75rem" }} />
        <SecuritySettings
          title="Incoming transactions"
          description="No limits on receiving funds"
          limitvalue="unlimited"
          onclick={() => {}}
        />
        <HorizontalDivider sxstyles={{ marginTop: "0.75rem" }} />
        <CustomiseMessage message="Customize security settings with Premium" />
      </div>

      <div className="upgrade">
        <img src={getpremium} alt="premium" />

        <p className="premium_title">Upgrade to Sphere Premium</p>

        <p className="get">
          <span>Advanced recovery options</span>
          <span>Custom node configurations</span>
          <span>Customizable security thresholds</span>
        </p>

        <SubmitButton
          text="Upgrade Now"
          sxstyles={{
            marginTop: "0.375rem",
            color: colors.accent,
            backgroundColor: colors.textprimary,
          }}
          onclick={onGetPremium}
        />
      </div>
    </section>
  );
};

const MigrateKeys = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="migratekeys" onClick={() => navigate("/premiums")}>
      <p>
        Migrate Keys
        <span>Move your keys to other nodes</span>
      </p>

      <span className="icons">
        <ChevronLeft width={6} height={11} color={colors.textprimary} />
      </span>
    </div>
  );
};

const SecurityScore = (): JSX.Element => {
  return (
    <div className="securityscore">
      <span className="icons">
        <Security color={colors.textprimary} />
      </span>
      <p>
        Security Score
        <span>
          <em>92</em> / 100
        </span>
      </p>
    </div>
  );
};

const SecurityAudit = (): JSX.Element => {
  return (
    <div className="healthcheck">
      <span className="icons">
        <Refresh width={16} height={15} color={colors.textprimary} />
      </span>
      <p>
        Last Audit
        <span>
          <em>18 / 18 Audits passed</em> · 2 min ago
        </span>
      </p>
    </div>
  );
};

const ActiveNodesCount = (): JSX.Element => {
  return (
    <div className="activenodescount">
      <span className="icons">
        <Import width={18} height={18} color={colors.textprimary} />
      </span>
      <p>
        Active Nodes
        <span>4 of 4 nodes online</span>
      </p>
    </div>
  );
};

const SecuritySettings = ({
  title,
  description,
  limitvalue,
  onclick,
}: {
  title: string;
  description: string;
  limitvalue: number | "unlimited";
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="settings" onClick={onclick}>
      <p className="title_desc">
        {title} <span>{description}</span>
      </p>

      <p className="limit">
        {limitvalue !== "unlimited" ? formatUsd(limitvalue) : "Unlimited"}

        {limitvalue !== "unlimited" && (
          <span className="icons">
            <ChevronLeft width={6} height={11} color={colors.textprimary} />
          </span>
        )}
      </p>
    </div>
  );
};

const CustomiseMessage = ({ message }: { message: string }): JSX.Element => {
  return (
    <p className="cutomisemessage">
      <Lock color={colors.textsecondary} /> {message}
    </p>
  );
};

const RecoveryOption = ({
  title,
  description,
  value,
  onclick,
}: {
  title: string;
  description: string;
  value: "enabled" | "premium";
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="recovery" onClick={onclick}>
      <p
        className="title_desc"
        style={{ color: value == "premium" ? colors.textsecondary : "" }}
      >
        {title} <span>{description}</span>
      </p>

      <p
        className="value"
        style={{ color: value == "premium" ? colors.textsecondary : "" }}
      >
        {value}
      </p>
    </div>
  );
};

const buttonStyles: CSSProperties = {
  width: "32%",
  padding: "0.375rem",
  fontSize: "0.75rem",
};
