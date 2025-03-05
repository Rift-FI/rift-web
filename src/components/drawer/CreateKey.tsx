import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import { SubmitButton } from "../global/Buttons";
import keysimg from "../../assets/images/consumesecret.png";
import "../../styles/components/drawer/createkey.scss";

export const CreateKey = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();

  return (
    <div className="createkey">
      <img src={keysimg} alt="secrets" />
      <p>Create upto 5 keys per crypto by subscribing to Premium</p>
      <SubmitButton
        text="Get Sphere Premium"
        onclick={() => {
          closeAppDrawer();
          navigate("/premiums");
        }}
      />
    </div>
  );
};
