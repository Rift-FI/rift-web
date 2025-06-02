import React, { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router";
import { IoScan, IoTime } from "react-icons/io5";
import { recentAddresses } from "./mock/tokenDetailsMockData";

function Send() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");

  function handleAddress(search: string) {
    setAddress(search);
  }

  function handlePasteAddress() {
    navigator.clipboard.readText().then((text) => {
      setAddress(text);
    });
  }

  function handleScanQRCode() {
    console.log("scanning QR code");
  }

  function handleContinue() {
    navigate(`/token/${id}/send/address/${address}`);
  }

  function handleSelectAddress(address: string) {
    setAddress(address);
  }

  return (
    <div className="flex flex-col w-full h-screen relative px-2">
      <div className="absolute top-0 left-0 w-full h-16 flex flex-row items-center justify-between px-2">
        <IoMdArrowRoundBack
          className="text-2xl text-primary"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-2xl font-bold text-primary">Send {id}</h1>
        <p></p>
      </div>
      <div className="flex items-center gap-2 rounded-3xl bg-surface-subtle justify-between p-3 w-full mt-20">
        <input
          type="text"
          placeholder="Address or Username"
          className="bg-transparent outline-none"
          onChange={(e) => handleAddress(e.target.value)}
        />
        <button
          className="text-primary text-sm py-2 px-4 bg-surface-alt rounded-3xl"
          onClick={handlePasteAddress}
        >
          Paste
        </button>
      </div>
      <div className="flex flex-col">
        {address === "" ? (
          <div className="my-8 flex gap-2 items-center">
            <IoScan
              className="text-primary text-5xl"
              onClick={handleScanQRCode}
            />
            <div className="flex flex-col">
              <p className="text-primary text-lg font-bold">Scan QR Code</p>
              <p className="text-text-subtle text-sm">
                Tap ton scan {id} address
              </p>
            </div>
          </div>
        ) : (
          <div className="my-8 flex gap-2 items-center w-full">
            <button
              className="w-full flex items-center justify-center flex-row gap-2 h-12 bg-primary font-bold text-accent rounded-lg"
              onClick={handleContinue}
            >
              Continue with {address.substring(0, 4)}...
              {address.substring(address.length - 4)}
            </button>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h1 className="text-text-subtle text-sm flex items-center gap-2 mb-2">
          <IoTime className="text-text-subtle text-2xl" />
          <span className="text-text-subtle text-lg font-bold">Recent</span>
        </h1>
        <div className="flex flex-col gap-2">
          {recentAddresses.map((address) => (
            <div
              key={address.address}
              className="flex flex-row items-center gap-2"
              onClick={() => handleSelectAddress(address.address)}
            >
              <img
                src={address.imageUrl}
                alt={address.network}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex flex-col">
                <p className="text-text-subtle text-sm">
                  {address.address.substring(0, 4)}...
                  {address.address.substring(address.address.length - 4)}
                </p>
                <p className="text-text-subtle text-sm font-semibold">
                  {address.network}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Send;
