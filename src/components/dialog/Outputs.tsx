import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDialog } from "../../hooks/dialog";
import { SubmitButton } from "../global/Buttons";
import { colors } from "../../constants";
import { Loading, Error } from "../../assets/animations";
import "../../styles/components/dialog.scss";

export const LoadingOutput = (): JSX.Element => {
  const { dialogMessage } = useAppDialog();

  return (
    <div className="outputs">
      <Loading width="3.75rem" height="3.75rem" />
      <p>{dialogMessage}</p>
    </div>
  );
};

export const ErrorOutput = (): JSX.Element => {
  const { closeAppDialog, dialogMessage } = useAppDialog();

  return (
    <div className="outputs errroutput">
      <Error width="6rem" height="6rem" />
      <p>{dialogMessage}</p>

      <SubmitButton text="Ok, Close" onclick={closeAppDialog} />
    </div>
  );
};

export const ImportKeyOutput = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDialog } = useAppDialog();

  const goToImport = () => {
    closeAppDialog();
    navigate("/importawx");
  };

  return (
    <div className="outputs importoutput">
      <Error width="6rem" height="6rem" />

      <p>Import your Airwallex API Key to buy OM</p>

      <div className="actions">
        <SubmitButton
          text="Cancel"
          sxstyles={{
            width: "49%",
            color: colors.danger,
            backgroundColor: "transparent",
          }}
          onclick={closeAppDialog}
        />
        <SubmitButton
          text="Ok"
          sxstyles={{ width: "49%" }}
          onclick={goToImport}
        />
      </div>
    </div>
  );
};
