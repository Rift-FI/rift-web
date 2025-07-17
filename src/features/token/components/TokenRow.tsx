import React from "react";

interface TokenRowProps {
  readonly title: string;
  readonly value: string | number;
  readonly extras?: string;
}

const TokenRow: React.FC<TokenRowProps> = React.memo(
  ({ title, value, extras }) => (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-gray-400 font-semibold pl-3">{title}</p>
      <div className="flex items-center gap-2 pr-3">
        <p className="text-sm text-secondary-foreground font-bold">{value}</p>
        {extras && <p className="text-sm font-semibold">{extras}</p>}
      </div>
    </div>
  )
);

TokenRow.displayName = "TokenRow";

export default TokenRow;
