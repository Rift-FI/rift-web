import wallet from "../../assets/images/wallet.svg";
import mpesa from "../../assets/images/mpesa1.png";
import { useNavigate } from "react-router-dom";

function ChooseDepositMethod() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-2xl font-bold text-center mt-4">
        Choose Deposit Method
      </h1>
      <p className="text-center text-gray-400">
        Choose the method you want to use to deposit money into your Sphere
        wallet
      </p>
      <div className="flex flex-col gap-4 h-screen items-center justify-center">
        <div
          className="bg-[#212121] border border-[#313131] rounded-xl p-4 w-full flex gap-4 cursor-pointer"
          onClick={() => navigate("/deposit")}
        >
          <img src={wallet} alt="wallet" className="w-24 h-24" />
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Wallet</h2>
            <p className="text-sm text-gray-400">
              Deposit using your wallet to your Sphere wallet
            </p>
          </div>
        </div>
        <div
          className="bg-[#212121] border border-[#ffb386] rounded-xl p-4 w-full flex gap-4 cursor-pointer"
          onClick={() => navigate("/deposit/mpesa")}
        >
          <img src={mpesa} alt="mpesa" className="w-24 h-24 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">M-PESA</h2>
            <p className="text-sm text-gray-400">
              Deposit using M-PESA to your Sphere wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChooseDepositMethod;
