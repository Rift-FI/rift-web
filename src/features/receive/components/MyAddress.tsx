import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { BiCopy } from "react-icons/bi";
import { useReceiveCrypto } from "../context";
import { FaChevronRight } from "react-icons/fa6";

export default function MyAddress() {
    const { switchCurrentStep } = useReceiveCrypto()
    const address = localStorage.getItem('address')
    const onCopyAddress = () => {
        navigator.clipboard.writeText(address as string)
        toast.success("Address copied to clipboard")
    }

    return (
        <div>
            <div className="w-full flex flex-row items-center justify-center">
                <div className="w-fit bg-secondary-foreground p-2 rounded-md">
                    <QRCodeSVG value={address as string} />
                </div>
            </div>

            <p className="text-center mt-4 font-medium">Your Ethereum Address</p>

            <div className="mt-1 flex flex-col items-center justify-center gap-3 bg-sidebar border-2 border-border rounded-md p-4">
                <p className="text-center font-semibold text-md break-words break-all">
                    {address}
                </p>
                <button className="flex flex-row items-center justify-center gap-1 font-semibold cursor-pointer" onClick={onCopyAddress}>Copy <BiCopy className="text-text-default" /></button>
            </div>

            <p className="text-center text-text-subtle text-md font-medium mt-2">Use your address to receive crypto in your Sphere wallet</p>

            <div onClick={() => switchCurrentStep('TOKEN-SELECT')}
                className="absolute bottom-0 left-0 right-0 bg-surface-subtle flex flex-row flex-nowrap items-center justify-between gap-2 p-4 cursor-pointer">
                <p className="flex flex-col items-start justify-start text-md font-bold">
                    Request Crypto
                    <span className="text-md text-text-subtle font-medium">Request crypto from anyone with a Sphere link</span>
                </p>
                <FaChevronRight />
            </div>
        </div>
    )
}