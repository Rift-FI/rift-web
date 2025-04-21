import { CSSProperties, JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "@/hooks/backbutton";
import { BottomButtonContainer } from "@/components/Bottom";
import { SubmitButton } from "@/components/global/Buttons";
import { FaIcon } from "@/assets/faicon";
import { colors } from "@/constants";
import "@/styles/pages/polymarket/market.scss";

export default function MarketDetails(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const buttonstyles: CSSProperties = {
    width: "49%",
    padding: "0.5rem",
    fontWeight: "bold",
    color: colors.textprimary,
  };

  const goBack = () => {
    navigate("/polymarket");
  };

  useBackButton(goBack);

  return (
    <section id="marketdetails">
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
          sxstyles={{ ...buttonstyles, backgroundColor: colors.accent }}
          onclick={() => {}}
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
          onclick={() => {}}
        />
      </BottomButtonContainer>
    </section>
  );
}
