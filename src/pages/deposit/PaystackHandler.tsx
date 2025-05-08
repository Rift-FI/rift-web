import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTabs } from "@/hooks/tabs";
import { useBackButton } from "@/hooks/backbutton";
import { checkTransactionStatus } from "@/utils/api/offramp/txstatus";
import { OFFRAMP_SOCKET } from "@/utils/api/config";
import { CheckAlt } from "@/assets/icons/actions";
import { Loading } from "@/assets/animations";
import { colors } from "@/constants";
import mpesa from "../../assets/images/mpesa1.png";
import usdc from "../../assets/images/labs/usdc.png";
import "@/styles/pages/deposit/paystackhadler.scss";

export default function PaystackHandler(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const txreference = localStorage.getItem("paystackreference");

  const [httpTransactionStatus, setHttpTransactionStatus] =
    useState<string>("");
  const [socketTransactionStatus, setSocketTransactionStatus] =
    useState<string>("");

  useQuery({
    queryKey: ["txstatus"],
    queryFn: () =>
      checkTransactionStatus(txreference as string)
        .then((res) => {
          setHttpTransactionStatus(res?.status);
        })
        .catch(() => {
          setHttpTransactionStatus("failed");
        }),
    refetchInterval: 5000,
  });

  const goBack = () => {
    localStorage.removeItem("paystackreference");
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  useEffect(() => {
    if (httpTransactionStatus === "success") {
      OFFRAMP_SOCKET.on("connect", () => {
        console.log("connected to socket server...");
      });

      OFFRAMP_SOCKET.on("OnRampDeposit", (data) => {
        if (data?.transactionHash) {
          setSocketTransactionStatus("success");

          OFFRAMP_SOCKET.off("OnRampDeposit");
        }
      });

      return () => {
        OFFRAMP_SOCKET.off("OnRampDeposit");
      };
    }
  }, [httpTransactionStatus]);

  return (
    <section id="paystackhandler">
      <div className="fiatstatus">
        <div className="img">
          <img src={mpesa} alt="mpesa" />
          <p>
            {httpTransactionStatus === "success" ? "Success" : "Processing"}
          </p>
        </div>

        {httpTransactionStatus === "success" ? (
          <CheckAlt color={colors.success} />
        ) : (
          <Loading />
        )}
      </div>

      {httpTransactionStatus === "success" && (
        <div className="fiatstatus cryptostatus">
          <div className="img">
            <img src={usdc} alt="usdc" />
            {socketTransactionStatus !== "success" && <p>Processing</p>}
          </div>

          {socketTransactionStatus !== "success" ? (
            <Loading />
          ) : (
            <CheckAlt color={colors.success} />
          )}
        </div>
      )}

      {httpTransactionStatus === "success" &&
        socketTransactionStatus === "success" && (
          <>
            <p className="complete">
              The transaction was completed successfully
            </p>
            <button onClick={goBack}>Check my balance</button>
          </>
        )}
    </section>
  );
}
