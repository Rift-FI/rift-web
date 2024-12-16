import { Fragment, JSX, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { SOCKET } from "../utils/api/config";
import { signupUser } from "../utils/api/signup";
import { createEVMWallet } from "../utils/api/wallet";
import { Loading } from "../assets/animations";
import "../styles/constants.css";
import "../styles/pages/auth.css";

export default function Authentication(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const details = {
    email: initData?.user?.username,
    password: initData?.user?.username,
  };

  const [httpSuccess, setHttpSuccess] = useState<boolean>(false);

  const onSignUp = async () => {
    if (!details.email || !details.password) {
      console.error("Email or password is undefined");
      return;
    }

    const { signupSuccess } = await signupUser(details.email, details.password);
    const { createWalletSuccess } = await createEVMWallet(
      details.email,
      details.password
    );

    if (signupSuccess && createWalletSuccess) {
      setHttpSuccess(true);
    }
  };

  const checkAccessUser = useCallback(() => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");

    if (address && token) navigate("/");
  }, []);

  useEffect(() => {
    if (httpSuccess) {
      SOCKET.on("AccountCreationSuccess", (data) => {
        localStorage.setItem("address", data?.address);
        localStorage.setItem("token", data?.accessToken);

        showsuccesssnack("Account and wallet retrieved successfully");
        navigate("/");
      });

      SOCKET.on("AccountCreationFailed", () => {});

      return () => {
        SOCKET.off("connect");
        SOCKET.off("disconnect");
      };
    }
  }, [httpSuccess]);

  useEffect(() => {
    checkAccessUser();
  }, []);

  useEffect(() => {
    if (details.email && details.password) {
      onSignUp();
    }
  }, [details]);

  return (
    <Fragment>
      <div id="signupc">
        <div className="loader">
          <p>loading...</p>
          <Loading width="1.75rem" height="1.75rem" />
        </div>
      </div>
    </Fragment>
  );
}
