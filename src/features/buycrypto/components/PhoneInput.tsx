import { MdKeyboardArrowLeft } from "react-icons/md";
import { useBuyCrypto } from "../context";
import { Input } from "@/components/ui/input";

export default function PhoneInput() {
  const { state, switchCurrentStep } = useBuyCrypto();

  const mpesaNumber = state?.watch("mpesaNumber");

  const goBack = () => {
    switchCurrentStep("CRYPTO-AMOUNT");
  };

  return (
    <div className="w-full mb-10">
      <button
        onClick={goBack}
        className="flex flex-row items-center justify-start p-1 pr-4 mb-2 rounded-full bg-secondary cursor-pointer hover:bg-surface-subtle transition-colors"
      >
        <MdKeyboardArrowLeft className="text-2xl text-text-default" />
        <span className="text-sm font-bold">Enter a different amount</span>
      </button>

      <p className="text-center font-semibold flex flex-col mt-8">
        Phone Number
        <span className="font-light">
          Please enter your M-pesa phone number
        </span>
      </p>

      <Input
        inputMode="tel"
        type="text"
        placeholder="0700-000-000"
        className="mt-4 h-12 font-semibold"
        value={mpesaNumber}
        onChange={(e) => state?.setValue("mpesaNumber", e.target.value)}
      />
    </div>
  );
}
