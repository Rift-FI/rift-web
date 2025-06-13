import { ChangeEvent } from "react";
import { useBuyCrypto } from "../context"
import useOnRamp from "@/hooks/wallet/use-on-ramp";
import { Input } from "@/components/ui/input"
import useToken from "@/hooks/data/use-token";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { MdKeyboardArrowLeft } from "react-icons/md";

export default function CryptoAmount() {
    const { state, switchCurrentStep } = useBuyCrypto();

    const selectedTokenId = state?.watch('purchaseTokenId');
    const cryptoAmount = Number(state?.watch('cryptoAmount'));

    const { USD_EXCHANGE_RATE } = useOnRamp();
    const { geckoQuery } = useGeckoPrice({ base: 'usd', token: selectedTokenId });
    const { data: SELECTED_TOKEN } = useToken({ id: selectedTokenId });

    const handleKesAmount = (cryptoQty: number) => {
        const calcAmount = cryptoQty * Number(geckoQuery.data || 0) * USD_EXCHANGE_RATE;
        return calcAmount.toFixed(2);
    }

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const cryptoQty = Number(e.target.value);
        state?.setValue('cryptoAmount', String(cryptoQty));
        state?.setValue('kesAmount', handleKesAmount(cryptoAmount));
    }

    const goBack = () => {
        switchCurrentStep('CHOOSE-TOKEN');
    }


    return (
        <div className="w-full mb-10">
            <button
                onClick={goBack}
                className="flex flex-row items-center justify-start p-1 pr-4 mb-2 rounded-full bg-secondary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
                <MdKeyboardArrowLeft className="text-2xl text-text-default" />
                <span className="text-sm font-bold">Choose Another Token</span>
            </button>

            <p className="text-center text-md font-medium text-md text-text-subtle mt-4">Buy <br /><span className="text-xl text-text-default font-semibold">{SELECTED_TOKEN?.name}</span></p>

            <div className="w-full flex flex-row items-center justify-center mt-4">
                <img className="w-12 h-12" src={SELECTED_TOKEN?.icon} alt={SELECTED_TOKEN?.name} />
            </div>

            <p className="text-sm font-medium mt-6">How much <span className="font-semibold">{SELECTED_TOKEN?.name}</span> would you like to buy ?</p>
            <Input type="number" inputMode="numeric" value={cryptoAmount == 0 ? '' : cryptoAmount} placeholder={`10 ${SELECTED_TOKEN?.name}`} className="mt-2 h-12 font-semibold" onChange={handleAmountChange} />

            <div className="mt-4 bg-secondary p-3 rounded-md">
                <p className="flex flex-row justify-between border-b border-surface-subtle pb-3">
                    <span>
                        1 {SELECTED_TOKEN?.name}
                    </span>

                    <span className="font-semibold">
                        ≈ {handleKesAmount(1)} KES
                    </span>
                </p>
                <p className="flex flex-row justify-between border-b border-surface-subtle pb-3 mt-3">
                    <span>You'll pay</span>
                    <span className="font-semibold">
                        {handleKesAmount(cryptoAmount || 0)} KES
                    </span>
                </p>
                <p className="flex flex-row justify-between mt-3">
                    <span>You'll receive</span>
                    <span className="font-semibold">
                        {cryptoAmount || 0} {SELECTED_TOKEN?.name}
                    </span>
                </p>
            </div>
        </div>
    )
}
