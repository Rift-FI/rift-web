import { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router";
import {
  faAnglesDown,
  faAnglesUp,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "@/hooks/backbutton";
import { useAppDrawer } from "@/hooks/drawer";
import { BottomButtonContainer } from "@/components/Bottom";
import { SubmitButton } from "@/components/global/Buttons";
import { HorizontalDivider } from "@/components/global/Divider";
import { PricesChart } from "@/components/polymarket/PriceChart";
import { FaIcon } from "@/assets/faicon";
import { colors } from "@/constants";
import marketimg from "@/assets/images/labs/mantracover.png";
import resolverimg from "@/assets/images/icons/uma.png";
import "@/styles/pages/polymarket/market.scss";

export default function MarketDetails(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openAppDrawerWithKey } = useAppDrawer();

  const goBack = () => {
    navigate("/polymarket");
  };

  const onTradeYes = () => {
    openAppDrawerWithKey("tradeyesno", id, "yes"); // drawer action : tradeyesno >> keyToShare : market id >> purpose : trade yes
  };

  const onTradeNo = () => {
    openAppDrawerWithKey("tradeyesno", id, "no"); // drawer action : tradeyesno >> keyToShare : market id >> purpose : trade no
  };

  useBackButton(goBack);

  return (
    <section id="marketdetails">
      <div className="img_title">
        <img src={marketimg} alt="market" />
        <p>Will Meta be forced to sell Instagram or WhatsApp in 2025?</p>
      </div>

      <HorizontalDivider
        sxstyles={{ width: "unset", margin: "0.5rem -1rem" }}
      />

      <div className="vol_startdate">
        <p>$14,740 Vol</p>
        <p>
          <FaIcon faIcon={faClock} color={colors.textprimary} fontsize={12} />
          Dec 31, 2025
        </p>
      </div>

      <HorizontalDivider
        sxstyles={{ width: "unset", margin: "0.5rem -1rem" }}
      />

      <p className="yes_percent">
        <span>YES</span> 12% Chance
      </p>
      <PricesChart />

      <div className="marketrules">
        <span>Rules</span>
        <HorizontalDivider sxstyles={{ margin: "0.375rem 0" }} />
        <p>
          This market refers to the case Federal Trade Commission v. Meta
          Platforms, Inc., Case No. 1:20-cv-03590-JEB, in the U.S. District
          Court for the District of Columbia. This market will resolve to "Yes"
          if Meta Platforms, Inc. formally announces it will or is legally
          compelled to divest or sell its Instagram and/or WhatsApp platforms,
          either partially or entirely, due to regulatory or legal action by the
          Federal Trade Commission (FTC) by December 31, 2025, 11:59 PM ET.
          Otherwise, this market will resolve to "No". This market will resolve
          based on the first decision rendered in the ongoing case Federal Trade
          Commission v. Meta Platforms, Inc., or announcement from Meta
          Platforms of a sale regardless of whether that decision is
          subsequently challenged or whether that sale actually takes place. If
          the FTC announces they are dropping the ongoing antitrust case against
          Meta Platforms, Inc., or if the Federal Trade Commission v. Meta
          Platforms, Inc. case is settled without requiring divestiture, this
          market may immediately resolve to "No". The primary resolution source
          for this market will be official information from Meta Platforms, Inc.
          and/or the US courts, however a consensus of credible reporting will
          also be used.
        </p>
      </div>

      <div className="resolver">
        <img src={resolverimg} alt="UMA" />

        <div className="address">
          <span>Resolver</span>
          <p>0x6A9D22...</p>
        </div>
      </div>

      <BottomButtonContainer
        sxstyles={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <SubmitButton
          text="Buy Yes"
          icon={
            <FaIcon
              faIcon={faAnglesUp}
              color={colors.textprimary}
              fontsize={12}
            />
          }
          sxstyles={{ ...buttonstyles, backgroundColor: colors.success }}
          onclick={onTradeYes}
        />

        <SubmitButton
          text="Buy No"
          icon={
            <FaIcon
              faIcon={faAnglesDown}
              color={colors.textprimary}
              fontsize={12}
            />
          }
          sxstyles={{ ...buttonstyles, backgroundColor: colors.danger }}
          onclick={onTradeNo}
        />
      </BottomButtonContainer>
    </section>
  );
}

const buttonstyles: CSSProperties = {
  width: "49%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  fontWeight: "bold",
  color: colors.textprimary,
};
