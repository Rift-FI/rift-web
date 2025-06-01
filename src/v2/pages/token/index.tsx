import BalanceContainer from "./features/BalanceContainer";
import { PriceChart } from "./features/PriceChart";
import Title from "./components/Title";
import TokenContainer from "./features/TokenContainer";
import TokenDetails from "./features/TokenDetails";
import TokenActivity from "./features/TokenActivity";
import { useNavigate, useParams } from "react-router-dom";
import { useTokenHistoricalData } from "@/hooks/token/useTokenHistoricalData";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaQrcode, FaSpinner, FaRetweet } from "react-icons/fa6";
import { colors } from "@/constants";
import { BsSendFill } from "react-icons/bs";
import { CiLink } from "react-icons/ci";

const tokenActions = [
  {
    icon: <FaQrcode color={colors.accent} size={24} />,
    label: "Receive",
  },
  {
    icon: <BsSendFill color={colors.accent} size={24} />,
    label: "Send",
  },
  {
    icon: <FaRetweet color={colors.accent} size={24} />,
    label: "Swap",
  },
  {
    icon: <CiLink color={colors.accent} size={24} />,
    label: "Link",
  },
];

function Token() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { historicalData, isLoadingHistoricalData, errorHistoricalData } =
    useTokenHistoricalData(id || "");

  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-danger">Token ID is required</p>
      </div>
    );
  }

  if (isLoadingHistoricalData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (errorHistoricalData || !historicalData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-danger">Error loading data</p>
      </div>
    );
  }
  function handleAction(action: string) {
    navigate(`/token/${id}/${action}`);
  }

  return (
    <div className="">
      <div className="w-full fixed bg-app-background z-10 h-16 flex flex-row items-center justify-between px-2 ">
        <IoMdArrowRoundBack className="text-2xl text-primary" />
        <h1 className={`text-xl font-bold text-primary`}>Sphere</h1>
        <p className=""></p>
      </div>
      <BalanceContainer id={id} />
      <PriceChart historicalPrice={historicalData} />
      <div className="flex justify-between mx-2 mt-2 gap-2 select-none">
        {tokenActions.map((action) => (
          <div
            key={action.label}
            className="w-24 h-24 rounded-lg flex items-center justify-center bg-accent flex flex-col gap-2"
            onClick={() => handleAction(action.label.toLowerCase())}
          >
            {action.icon}
            <p className="text-sm font-medium">{action.label}</p>
          </div>
        ))}
      </div>
      <Title title="Your Balance" />
      <TokenContainer tokenID={id} />
      <Title title="Token Details" />
      <TokenDetails tokenID={id} />
      <Title title="Activity" />
      <TokenActivity tokenID={id} />
    </div>
  );
}

export default Token;
