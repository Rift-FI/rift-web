import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";
import {
  IconArrowBackUp,
  IconChartInfographic,
  IconHomeFilled,
  IconUserCircle,
} from "@tabler/icons-react";

function BusinessSuite() {
  toast.success("Switched to Sphere Business");
  useEffect(() => {}, []);
  return (
    <div className="h-screen bg-primary font-body relative">
      <Link to="/app">
        <IconArrowBackUp size={26} />
      </Link>
      <h1 className="text-textprimary text-xl font-bold text-center">
        Business One Click Suite
      </h1>
      <p className="text-sm text-textsecondary text-center leading-relaxed pb-2 border-b-[1px] border-gray-500">
        Streamline Airdrops and Token Distributions with One Click
      </p>
      <div className="absolute bottom-4 w-full px-4 items-center justify-between flex bg-primary/50">
        <IconHomeFilled size={26} />
        <IconChartInfographic size={26} />
        <IconUserCircle size={26} />
      </div>
    </div>
  );
}

export default BusinessSuite;
