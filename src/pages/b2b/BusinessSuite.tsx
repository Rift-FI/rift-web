import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";
import { IconArrowBackUp } from "@tabler/icons-react";

function BusinessSuite() {
  toast.success("Switched to Sphere Business");
  useEffect(() => {}, []);
  return (
    <div className="h-screen bg-primary font-body  text-center">
      <Link to="/app">
        <IconArrowBackUp size={26} />
      </Link>
      <h1 className="text-textprimary text-xl font-bold mt-2">
        Business One Click Suite
      </h1>
      <p className="text-sm text-textsecondary text-s leading-relaxed pb-4 border-b-[1px] border-gray-500">
        Streamline Airdrops and Token Distributions with One Click
      </p>
    </div>
  );
}

export default BusinessSuite;
