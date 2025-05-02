import { JSX } from "react";
import { useNavigate } from "react-router";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { useAppDrawer } from "../../hooks/drawer";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import keysimg from "../../assets/images/consumesecret.png";
import "../../styles/components/drawer/createkey.scss";

export const CreateKey = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();

  return (
    <div className="createkey">
      <img src={keysimg} alt="secrets" />
      <p>
        You can create upto 5 keys per crypto by subscribing to Sphere Premium
      </p>
      <SubmitButton
        text="Get Sphere Premium"
        icon={<FaIcon faIcon={faCrown} color={colors.textprimary} />}
        onclick={() => {
          closeAppDrawer();
          navigate("/premiums");
        }}
        sxstyles={{
          padding: "0.625rem",
          borderRadius: "2rem",
        }}
      />
    </div>
  );
};
