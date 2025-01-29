import { Airdropped } from "../../components/charts/Airdropped";
import { UnlockedChart } from "../../components/charts/Unlocked";
import { PointsChart } from "../../components/charts/Points";
import { TxnTable } from "./TxnTable";
import { PaginationContainer } from "./Pagination";
import { IconPlus } from "@tabler/icons-react";

function HomeTab() {
  return (
    <div>
      <h1 className="text-textprimary text-xl font-bold text-center mt-1">
        Business One Click Suite
      </h1>
      <p className="text-sm text-textsecondary text-center leading-relaxed pb-2 border-b-[1px] border-gray-500">
        Streamline Airdrops and Token Distributions with One Click
      </p>
      <div className="px-2">
        <div className="w-full bg-divider rounded-xl mt-2 h-auto">
          <div className="flex items-center justify-between">
            <div className="px-4 py-4">
              <h1 className="text-textprimary text-4xl font-body font-bold">
                $1,000
              </h1>
              <p className="text-gray-500 text-xs font-semibold leading-relaxed">
                Airdropped this month
              </p>
            </div>
            <div className="flex flex-col items-center justify-center pr-2">
              <IconPlus size={30} className="cursor-pointer" />
              {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
            </div>
          </div>
          <Airdropped />
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="bg-divider/10 w-full rounded-xl mx-1">
            <div className="flex items-center justify-between">
              <div className="px-4 py-4">
                <h1 className="text-textprimary text-xl font-body font-bold">
                  $4,175
                </h1>
                <p className=" text-gray-400 text-xs font-semibold leading-relaxed">
                  USDC Unlocked
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <IconPlus size={30} className="cursor-pointer" />
                {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
              </div>
            </div>
            <UnlockedChart />
          </div>
          <div className="bg-divider w-full rounded-xl mx-1">
            <div className="flex items-center justify-between">
              <div className="px-4 py-4">
                <h1 className="text-textprimary text-xl font-body font-bold">
                  10,000
                </h1>
                <p className=" text-gray-400 text-xs font-semibold leading-relaxed">
                  Distrubuted Points
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <IconPlus size={30} className="cursor-pointer" />
                {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
              </div>
            </div>
            <PointsChart />
          </div>
        </div>
      </div>
      <h1 className="font-body px-2 font-semibold text-xl mt-4 mb-2 ">
        Transaction History
      </h1>
      <TxnTable />
      <PaginationContainer />
    </div>
  );
}

export default HomeTab;
