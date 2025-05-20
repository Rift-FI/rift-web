import { colors } from "@/constants";
import React from "react";

interface TokenRowProps {
  title: string;
  value: string | number;
  extras?: string;
}
function TokenRow({ title, value, extras }: TokenRowProps) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{
        borderBottomColor: colors.primary,
        borderBottomWidth: 0.5,
      }}
    >
      <p
        className="text-sm font-medium"
        style={{
          color: colors.textsecondary,
        }}
      >
        {title}
      </p>
      <p className="text-sm font-medium">{value}</p>
      {extras && <p className="text-sm font-medium">{extras}</p>}
    </div>
  );
}

export default TokenRow;
