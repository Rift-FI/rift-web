import { JSX } from "react";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { SubmitButton } from "../global/Buttons";
import email from "../../assets/images/icons/email.png";
import phone from "../../assets/images/icons/phone.png";
import "../../styles/components/drawer/deleterecovery.scss";

export const DeleteRecovery = (): JSX.Element => {
  const { action, keyToshare, closeAppDrawer } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const deleteEmail = () => {
    localStorage.removeItem("useremail");
    showsuccesssnack("Email address was removed successfully");
    closeAppDrawer();
  };

  const deletePhone = () => {
    localStorage.removeItem("userphone");
    showsuccesssnack("Phone Number was removed successfully");
    closeAppDrawer();
  };

  return (
    <div className="deleterecovery">
      <img src={action == "deleteemail" ? email : phone} alt="" />

      <p>
        Are you sure you want to delete your recovery&nbsp;
        {action == "deleteemail" ? "email address" : "phone number"}
        &nbsp;<span>{keyToshare?.substring(0, 5)}***</span> ?
      </p>

      <SubmitButton
        text={`Yes Delete My ${
          action == "deleteemail" ? "Email Address" : "Phone Number"
        }`}
        sxstyles={{ padding: "0.625rem" }}
        onclick={action == "deleteemail" ? deleteEmail : deletePhone}
      />

      <p className="undone">This action cannot be undone !</p>
    </div>
  );
};
