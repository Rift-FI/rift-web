import { JSX, useEffect, useCallback } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { signupUser } from "../utils/api/signup";
import { createEVMWallet } from "../utils/api/wallet";
// import {
//   signupQuvaultUser,
//   signinQuvaultUser,
// } from "../utils/api/quvault/auth";
import { useSocket } from "../utils/SocketProvider";
import { Loading } from "../assets/animations";
import "../styles/pages/auth.scss";

export default function Authentication(): JSX.Element {
  const { initData } = useLaunchParams();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const tgUsername: string = initData?.user?.username as string;

  const { mutate: mutatecreatewallet, isSuccess: createwalletsuccess } =
    useMutation({
      mutationFn: () => createEVMWallet(tgUsername),
    });
  const { mutate: mutateSignup, isSuccess: signupsuccess } = useMutation({
    mutationFn: () => signupUser(tgUsername),
    onSuccess: () => {
      mutatecreatewallet();
    },
  });
  // quvault (pst | launchpad)
  // const { mutate: createquvaultaccount, isSuccess: createquvaultsuccess } =
  //   useMutation({
  //     mutationFn: () =>
  //       signupQuvaultUser(tgUsername, `${tgUsername}@sphere.app`, tgUsername),
  //     onSuccess: (data) => {
  //       localStorage.setItem("quvaulttoken", data?.token);
  //     },
  //   });
  // const { mutate: quvaultlogin, isSuccess: quvaultloginsuccess } = useMutation({
  //   mutationFn: () => signinQuvaultUser(`${tgUsername}@sphere.app`, tgUsername),
  //   onError: (err) => {
  //     console.log(err);
  //     createquvaultaccount();
  //   },
  //   onSuccess: (data) => {
  //     localStorage.setItem("quvaulttoken", data?.token);
  //   },
  // });

  const checkAccessUser = useCallback(() => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");
    let quvaulttoken: string | null = localStorage.getItem("quvaulttoken");

    if (address && token && quvaulttoken) {
      navigate("/app");
    } else {
      // quvaultlogin();
      mutateSignup();
    }
  }, []);

  useEffect(() => {
    checkAccessUser();
  }, []);

  useEffect(() => {
    if (
      signupsuccess &&
      createwalletsuccess &&
      socket
      // && (quvaultloginsuccess || createquvaultsuccess)
    ) {
      socket.on("AccountCreationSuccess", (data) => {
        localStorage.setItem("address", data?.address);
        localStorage.setItem("btcaddress", data?.btcAdress);
        localStorage.setItem("token", data?.accessToken);

        const retries = 8;

        if (data?.user == tgUsername) {
          socket.off("AccountCreationSuccess");
          socket.off("AccountCreationFailed");

          navigate("/app");
        } else {
          for (let i = 0; i < retries; i++) {
            mutateSignup();
          }
        }
      });

      socket.on("AccountCreationFailed", () => {});

      return () => {
        socket.off("AccountCreationSuccess");
        socket.off("AccountCreationFailed");
      };
    }
  }, [signupsuccess, createwalletsuccess]);

  return (
    <section id="signupc">
      <div className="loader">
        <p>loading, please wait...</p>
        <Loading width="1.75rem" height="1.75rem" />
      </div>
    </section>
  );
}
