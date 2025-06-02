import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdBackspace } from "react-icons/md";
import { tokenListData } from "./mock/tokenDetailsMockData";

function CompleteSendTransaction() {
  const { address, id } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("0");

  const handleNumberClick = (num: string) => {
    if (amount === "0") {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleDecimalClick = () => {
    if (!amount.includes(".")) {
      setAmount(amount + ".");
    }
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount("0");
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleUseMax = () => {
    setAmount(
      tokenListData
        .find((token) => token.symbol === id)
        ?.userBalance.toString() || "0"
    );
  };

  function handleExchangeRate(amount: string) {
    console.log("Handling exchange rate for:", id);
    return parseFloat(amount) * 1.02;
  }

  const handleContinue = () => {
    console.log("Continue with amount:", amount);
  };

  return (
    <div className="flex flex-col w-full h-screen relative px-4">
      <div className="absolute top-0 left-0 w-full h-16 flex flex-row items-center justify-between px-4">
        <IoMdArrowRoundBack
          className="text-2xl text-primary"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-2xl font-bold text-primary">Send</h1>
        <button className="text-primary text-lg"></button>
      </div>

      <div
        className="bg-surface-subtle rounded-3xl cursor-pointer py-3 px-4 w-full mt-20 flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <h1 className="text-text-subtle font-bold text-lg flex items-center gap-2">
          To
        </h1>
        <p className="text-text-subtle text-lg">
          {address?.substring(0, 7)}...
          {address?.substring(address.length - 7)}
        </p>
      </div>
      <div className="flex flex-col items-center mt-8 mb-4 h-1/2 w-full justify-center">
        <div className="text-7xl font-bold text-white mb-2">{amount}</div>
        <div className="text-text-subtle text-xl">
          ≈ ${handleExchangeRate(amount).toFixed(2)}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end pb-8">
        <div className="flex items-center justify-between bg-surface-subtle rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <img
              src={tokenListData.find((token) => token.symbol === id)?.imageUrl}
              alt={id}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <div className="text-white font-semibold">
                {tokenListData.find((token) => token.symbol === id)?.symbol}
              </div>
              <div className="text-text-subtle text-sm">
                {tokenListData.find((token) => token.symbol === id)?.name}
              </div>
            </div>
          </div>
          <button
            className="text-purple-400 font-semibold"
            onClick={handleUseMax}
          >
            Use Max
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {["1", "2", "3"].map((num) => (
            <button
              key={num}
              className="h-16 text-2xl font-semibold text-white flex items-center justify-center"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}

          {["4", "5", "6"].map((num) => (
            <button
              key={num}
              className="h-16 text-2xl font-semibold text-white flex items-center justify-center"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}

          {["7", "8", "9"].map((num) => (
            <button
              key={num}
              className="h-16 text-2xl font-semibold text-white flex items-center justify-center"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}

          <button
            className="h-16 text-2xl font-semibold text-white flex items-center justify-center"
            onClick={handleDecimalClick}
          >
            .
          </button>
          <button
            className="h-16 text-2xl font-semibold text-white flex items-center justify-center"
            onClick={() => handleNumberClick("0")}
          >
            0
          </button>
          <button
            className="h-16 text-2xl text-white flex items-center justify-center"
            onClick={handleBackspace}
          >
            <MdBackspace />
          </button>
        </div>

        <button
          className={`w-full h-14 bg-primary text-accent font-semibold rounded-3xl ${
            amount === "0" ? "bg-surface-subtle text-primary" : ""
          }`}
          onClick={handleContinue}
          disabled={amount === "0"}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default CompleteSendTransaction;
