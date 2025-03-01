import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import { SubmitButton } from "../global/Buttons";
import { Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import password from "../../assets/images/icons/password.png";
import "../../styles/components/drawer/addpin.scss";

export const AddPin = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();

  const setupPin = () => {
    closeAppDrawer();
    navigate("/security/pin");
  };

  return (
    <div className="addkey">
      <p className="title">
        Set Up a PIN <span>Please add a PIN to your account</span>
      </p>

      <img src={password} alt="PIN" />

      <p className="required">
        A PIN helps to secure your transactions (only you can send money from
        your wallet)
      </p>

      <SubmitButton
        text="Setup My PIN Now"
        icon={<Stake color={colors.textprimary} />}
        onclick={setupPin}
      />
    </div>
  );
};
