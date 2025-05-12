import { JSX } from "react";
import { useAppDialog } from "../../hooks/dialog";
import { Loading } from "../../assets/animations";
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
