import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { BiCopy } from "react-icons/bi";

export default function ReceiveCrypto() {
  const address = localStorage.getItem('address');
  const onCopyAddress = () => {
    navigator.clipboard.writeText(address as string);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
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
    </div>
  );
}
