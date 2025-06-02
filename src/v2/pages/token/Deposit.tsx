import React, { useState } from "react";
import qrcode from "./mock/images/qrcode.png";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { mockAddress } from "./mock/tokenDetailsMockData";
import { FaCheck, FaCopy } from "react-icons/fa6";
import { CiShare2 } from "react-icons/ci";

function Deposit() {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  // TODO: get the token name using the id from the backend
  const { id } = useParams();

  function handleCopyAddress() {
    setIsCopied(true);
    // TODO: add a toast notification here
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    navigator.clipboard.writeText(mockAddress);
  }

  function handleShareAddress() {
    // TODO: add a share address functionality here
  }

  return (
    <div className="flex flex-col w-full h-screen relative">
      <div className="absolute top-0 left-0 w-full h-16 flex flex-row items-center justify-between px-2">
        <IoMdArrowRoundBack
          className="text-2xl text-primary"
          onClick={() => navigate(-1)}
        />
        <h1 className={`text-2xl font-bold text-primary`}>Receive Address</h1>
        <p className=""></p>
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        <div className="flex flex-col w-48 h-48 items-center justify-center bg-white rounded-2xl">
          <img src={qrcode} alt="qrcode" className="w-48 h-48" />
        </div>
        <p className="text-lg font-bold text-primary mt-4">
          Your Sphere({id}) address
        </p>
        <p className="text-md text-primary mt-2 text-center">
          Use this address to receive Sphere tokens.
        </p>
      </div>
      <div className="flex flex-col w-full items-center justify-center px-4 gap-4 mb-4">
        <button
          className="w-full flex items-center justify-center flex-row gap-2 h-12 bg-primary font-bold text-accent rounded-lg"
          onClick={handleCopyAddress}
        >
          {isCopied ? (
            <>
              Address Copied!
              <FaCheck className="text-xl text-accent cursor-pointer" />
            </>
          ) : (
            <>
              {mockAddress.substring(0, 7)}...
              {mockAddress.substring(mockAddress.length - 7)}{" "}
              <FaCopy className="text-xl text-accent cursor-pointer" />
            </>
          )}
        </button>
        <button
          className="w-full flex items-center justify-center flex-row gap-2 h-12 bg-accent text-primary rounded-lg"
          onClick={handleShareAddress}
        >
          Share Address
          <CiShare2 className="text-2xl text-primary cursor-pointer" />
        </button>
      </div>
    </div>
  );
}

export default Deposit;
