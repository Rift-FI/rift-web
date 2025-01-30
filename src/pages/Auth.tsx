import { JSX, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { SOCKET } from "../utils/api/config";
import { signupUser } from "../utils/api/signup";
import { createEVMWallet } from "../utils/api/wallet";
import { Loading } from "../assets/animations";
import "../styles/pages/auth.scss";

export default function Authentication(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();

  const details = {
    email: initData?.user?.username,
    password: initData?.user?.username,
  };

  const [httpSuccess, setHttpSuccess] = useState<boolean>(false);

  const onSignUp = async () => {
    if (!details.email || !details.password) {
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

    if (address && token) {
      navigate("/app");
    } else {
      if (details.email && details.password) {
        onSignUp();
      }
    }
  }, []);

  useEffect(() => {
    if (httpSuccess) {
      SOCKET.on("AccountCreationSuccess", (data) => {
        localStorage.setItem("address", data?.address);
        localStorage.setItem("btcaddress", data?.btcAdress);
        localStorage.setItem("token", data?.accessToken);

        const retries = 8;

        if (data?.user == details?.email) {
          SOCKET.off("AccountCreationSuccess");
          SOCKET.off("AccountCreationFailed");

          navigate("/app");
        } else {
          for (let i = 0; i < retries; i++) {
            onSignUp();
          }
        }
      });

      SOCKET.on("AccountCreationFailed", () => {
        console.log("accounts event...!!!");
      });

      return () => {
        SOCKET.off("AccountCreationSuccess");
        SOCKET.off("AccountCreationFailed");
      };
    }
  }, [httpSuccess]);

  useEffect(() => {
    checkAccessUser();
  }, []);

  return (
    <section id="signupc">
      <div className="loader">
        <p>loading, please wait...</p>
        <Loading width="1.75rem" height="1.75rem" />
      </div>
    </section>
  );
}
