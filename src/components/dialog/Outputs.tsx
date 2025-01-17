import { JSX } from "react";
import { useAppDialog } from "../../hooks/dialog";
import { Loading, Success, Error } from "../../assets/animations";
import "../../styles/components/dialog.css";

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
      <button onClick={() => closeAppDialog()}>Close</button>
    </div>
  );
};
