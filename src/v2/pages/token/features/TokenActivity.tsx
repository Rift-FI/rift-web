import React from "react";
import { useTokenActivity } from "@/hooks/token/useTokenActivity";
import { FaSpinner } from "react-icons/fa6";

function TokenActivity({ tokenID }: { tokenID: string | undefined }) {
  const { tokenActivity, isLoadingTokenActivity, errorTokenActivity } =
    useTokenActivity(tokenID);

  if (!tokenID) {
    return (
      <div className="flex items-center justify-center flex-col mb-32">
        <h1 className="text-lg font-bold">No Token ID</h1>
        <p className="text-xs text-gray-500">Token ID is required</p>
      </div>
    );
  }

  if (isLoadingTokenActivity) {
    return (
      <div className="flex items-center justify-center flex-col mb-32">
        <FaSpinner className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (errorTokenActivity) {
    return (
      <div className="flex items-center justify-center flex-col mb-32">
        <h1 className="text-lg font-bold">Error</h1>
        <p className="text-xs text-gray-500">
          Error loading token activity. {errorTokenActivity.message}
        </p>
      </div>
    );
  }

  if (!tokenActivity || "status" in tokenActivity) {
    return (
      <div className="flex items-center justify-center flex-col mb-32">
        <h1 className="text-lg font-bold">Error</h1>
        <p className="text-xs text-gray-500">Error loading token activity.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-col mb-4 mx-2">
      {tokenActivity.map((activity, index) => (
        <div
          key={`${activity.date}-${index}`}
          className="mb-4 p-4 bg-secondary rounded-lg mx-2 w-full"
        >
          <div className="flex items-center gap-2">
            <img
              src={activity.imageUrl}
              alt={activity.type}
              width={44}
              height={44}
              className="rounded-2xl"
            />
            <div>
              <p className="text-lg font-semibold text-primary">
                {activity.title}
              </p>
              <p className="text-xs text-textsecondary font-medium mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TokenActivity;
