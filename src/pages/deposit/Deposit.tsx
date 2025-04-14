import { JSX } from "react";
import { useNavigate } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { SubmitButton } from "../../components/global/Buttons";

import { FaIcon } from "../../assets/faicon";
import { colors } from "@/constants";
// import { colors } from "../../constants";
// import "../../styles/pages/deposit/deposit.scss";

export default function Deposit(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  // const [depositTarget, setDepositTarget] = useState<"me" | "other">("me"); // Commented out target selection
  // const [depositMethod, setDepositMethod] = useState<"airwallex" | "external">(
  //   "external"
  // ); // Commented out method state, assuming 'external'

  const onDeposit = () => {
    // if (depositMethod == "external") { // Simplified logic
    navigate("/deposit-address");
    // } else {
    //   navigate(`/deposit-awx/${depositTarget}`);
    // }
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  // Apply theme, use flex to push button down
  return (
    <section
      id="deposit-screen"
      className="flex flex-col h-screen bg-[#212523] text-[#f6f7f9] px-4 pb-4 pt-6"
    >
      {/* Header Text */}
      <div className="text-center mt-8">
        <p className="text-xl text-[#f6f7f9] font-bold">
          Deposit from External Network
        </p>
        <p className="text-sm text-gray-400 my-2">
          Select an asset below to view your deposit address and required
          network.
        </p>
      </div>

      {/* Spacer to push button down */}
      <div className="flex-grow"></div>

      {/* Themed Submit Button */}
      <div className="shrink-0">
        <SubmitButton
          text="Choose Asset to Deposit"
          icon={<FaIcon faIcon={faCircleArrowUp} color={colors.primary} />}
          onclick={onDeposit}
          sxstyles={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "2rem",
            fontSize: "0.875rem",
            fontWeight: "bold",
          }}
        />
      </div>
    </section>
  );
}
