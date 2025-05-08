import { JSX, useState, useEffect, useCallback } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { signupUser } from "../utils/api/signup";
import { createAccount } from "../utils/api/wallet";
import {
  signupQuvaultUser,
  signinQuvaultUser,
} from "../utils/api/quvault/auth";
import { useSocket } from "../utils/SocketProvider";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDialog } from "../hooks/dialog";

export default function Auth(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { initData } = useLaunchParams();
  const { socket } = useSocket();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [httpAuthOk, setHttpAuthOk] = useState<boolean>(false);
  const [devicetoken, setDeviceToken] = useState<string>("default-token");

  const tgUserId: string = `${String(initData?.user?.id as number)}`;
  const devicename = "Samsung-A15";
  const referrer = localStorage.getItem("referrer");

  const generateToken = async () => {
    generatePersistentDeviceToken(tgUserId).then((token: string) => {
      setDeviceToken(token);
    });
  };

  const onSignup = async () => {
    try {
      openAppDialog("loading", "Setting up your account...");
      // try quvault sign in first
      const quvaultSignInResult = await signinQuvaultUser(
        `${tgUserId}@sphereid.com`,
        tgUserId
      );

      if (quvaultSignInResult?.token) {
        localStorage.setItem("quvaulttoken", quvaultSignInResult.token);
        console.log("quvault signin success");

        const { status: signupstatus } = await signupUser(
          tgUserId,
          devicetoken,
          devicename,
          "0",
          "0",
          referrer ?? undefined
        );

        const { status: createaccstatus } = await createAccount(
          tgUserId,
          tgUserId,
          devicetoken,
          0,
          "0"
        );

        if (signupstatus == 200 && createaccstatus == 200) {
          setHttpAuthOk(true);
        }
      } else {
        // try quvault signup if signin fails
        const quvaultSignUpResult = await signupQuvaultUser(
          tgUserId,
          `${tgUserId}@sphereid.com`,
          tgUserId
        );

        localStorage.setItem("quvaulttoken", quvaultSignUpResult.token);

        const { status: signupstatus } = await signupUser(
          tgUserId,
          devicetoken,
          devicename,
          "0",
          "0",
          referrer ?? undefined
        );

        const { status: createaccstatus } = await createAccount(
          tgUserId,
          tgUserId,
          devicetoken,
          0,
          "0"
        );

        if (signupstatus == 200 && createaccstatus == 200) {
          setHttpAuthOk(true);
        }
      }
    } catch (error) {
      console.log("there was an issue with account creation & login");
    }
  };

  const userAuthenticated = useCallback(() => {
    const ethaddress: string | null = localStorage.getItem("ethaddress");
    const token: string | null = localStorage.getItem("spheretoken");
    const quvaulttoken: string | null = localStorage.getItem("quvaulttoken");
    const authsessionversion: string | null = localStorage.getItem(
      "auth_session_version"
    );

    if (
      ethaddress == null ||
      typeof ethaddress == undefined ||
      token == null ||
      typeof token == undefined ||
      quvaulttoken == null ||
      typeof quvaulttoken == undefined ||
      authsessionversion == null ||
      typeof authsessionversion == undefined
    ) {
      generateToken().then(() => {
        onSignup();
      });
    } else {
      closeAppDialog();
      navigate("/app");
      return;
    }
  }, []);

  useEffect(() => {
    openAppDialog("loading", "Preparing...");
    userAuthenticated();
  }, []);

  useEffect(() => {
    if (socket && httpAuthOk) {
      openAppDialog("loading", "Setting up your wallet...");

      const handleAccountCreationSuccess = (data: any) => {
        console.log("account creation success");

        if (data?.address) localStorage.setItem("ethaddress", data.address);
        if (data?.accessToken)
          localStorage.setItem("spheretoken", data.accessToken);
        localStorage.setItem("auth_session_version", "v2");

        if (data?.user == tgUserId) {
          showsuccesssnack("Your wallet is ready...");
          closeAppDialog();

          socket.off("AccountCreationSuccess");
          socket.off("AccountCreationFailed");

          localStorage.removeItem("referrer");
          navigate("/app", { replace: true });
        } else {
          console.log("retrying authentication");
          onSignup();
        }
      };

      const handleAccountCreationFailed = (error: any) => {
        console.error("an error occurred, re-trying:", error);
        openAppDialog("loading", "Please wait...this might take a while");
        onSignup();
      };

      socket.on("AccountCreationSuccess", handleAccountCreationSuccess);
      socket.on("AccountCreationFailed", handleAccountCreationFailed);

      return () => {
        socket.off("AccountCreationSuccess", handleAccountCreationSuccess);
        socket.off("AccountCreationFailed", handleAccountCreationFailed);
      };
    }
  }, [socket, httpAuthOk]);

  return <section id="signup" />;
}

const getPersistentDeviceInfo = async (): Promise<string> => {
  const deviceAttributes = [];

  deviceAttributes.push(navigator.hardwareConcurrency?.toString() || "");

  deviceAttributes.push(
    `${screen.width}x${screen.height}x${screen.colorDepth}`
  );

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        deviceAttributes.push(`${vendor}|${renderer}`);
      }
    }
  } catch (e) {
    console.log(e);
  }

  return deviceAttributes.filter(Boolean).join("|");
};

const generatePersistentDeviceToken = async (
  tgUserId: string
): Promise<string> => {
  const deviceInfo = await getPersistentDeviceInfo();

  const combinedString = `${tgUserId}-${deviceInfo}`;

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(combinedString)
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const deviceToken = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return deviceToken;
};
