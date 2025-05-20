import { colors } from "@/constants";
import { IoMdArrowRoundBack } from "react-icons/io";

function TokenHeader({ title }: { title: string }) {
  return (
    <div className="w-full h-16 flex flex-row items-center justify-between px-2">
      <IoMdArrowRoundBack className="text-2xl" color={colors.textprimary} />
      <h1 className={`text-xl font-bold ${colors.textprimary}`}>{title}</h1>
      <p className=""></p>
    </div>
  );
}

export default TokenHeader;
