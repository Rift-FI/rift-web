import { OptionTile, SectionActions } from "@/v2/ui/flow";
import {
  FiSmartphone,
  FiCreditCard,
  FiShoppingBag,
} from "react-icons/fi";
import { RiBankLine } from "react-icons/ri";
import { usePay } from "../context";

type PayType = "MOBILE" | "PAYBILL" | "BUY_GOODS" | "BANK";

interface PayOption {
  type: PayType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const OPTIONS: PayOption[] = [
  {
    type: "MOBILE",
    icon: FiSmartphone,
    title: "Send Money",
    description: "To an M-Pesa or Airtel number",
  },
  {
    type: "PAYBILL",
    icon: FiCreditCard,
    title: "Paybill",
    description: "Pay to a business paybill number",
  },
  {
    type: "BUY_GOODS",
    icon: FiShoppingBag,
    title: "Buy Goods",
    description: "Pay to a till number",
  },
  {
    type: "BANK",
    icon: RiBankLine,
    title: "Bank Transfer",
    description: "Send to any Kenyan bank account",
  },
];

export default function PaymentTypeSelector() {
  const { setCurrentStep, updatePaymentData, method, paymentData } = usePay();
  const options = method === "mobile" ? OPTIONS.filter((o) => o.type !== "BANK") : OPTIONS;

  const handleTypeSelect = (type: PayType) => {
    updatePaymentData({ type });
    setCurrentStep("recipient");
  };

  const handleBack = () => setCurrentStep("country");

  return (
    <div className="w-full">
      <p className="mb-3 text-[13px] font-medium text-ink-2">Choose payment type</p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Payment type">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <li key={opt.type}>
              <OptionTile onClick={() => handleTypeSelect(opt.type)} selected={paymentData.type === opt.type}>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-subtle text-accent-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-ink">{opt.title}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">{opt.description}</span>
                </span>
              </OptionTile>
            </li>
          );
        })}
      </ul>
      <SectionActions onBack={handleBack}>{null}</SectionActions>
    </div>
  );
}
