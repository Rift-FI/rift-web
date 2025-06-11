import React from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import TokenDrawer from "@/features/token";

const ErrorFallback: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-center items-center h-screen">
    <p className="text-danger">{message}</p>
  </div>
);

const Token: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorFallback message="Token ID is required" />;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <TokenDrawer
        tokenId={id}
        renderTrigger={() => (
          <Button size="lg">Open {id.toUpperCase()} Token Details</Button>
        )}
      />
    </div>
  );
};

Token.displayName = "Token";

export default Token;
