import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDialog } from "../../hooks/dialog";
import { Loading, Success, Error } from "../../assets/animations";
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

export const SuccessOutput = (): JSX.Element => {
  const { dialogMessage } = useAppDialog();

  return (
    <div className="outputs">
      <Success width="4rem" height="4rem" />
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
      <button onClick={() => closeAppDialog()}>Ok, Close</button>
    </div>
  );
};

export const ImportKeyOutput = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDialog } = useAppDialog();

  const goToImport = () => {
    navigate("/importawx");
  };

  return (
    <div className="outputs importoutput">
      <Error width="6rem" height="6rem" />

      <p>To buy OM using USD or HKD, import your Airwallex API Key !</p>

      <div className="actions">
        <button onClick={goToImport}>Ok</button>
        <button className="cancel" onClick={() => closeAppDialog()}>
          Cancel
        </button>
      </div>
    </div>
  );
};
