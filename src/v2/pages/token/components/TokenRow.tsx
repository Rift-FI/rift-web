import React from "react";

// Types
interface TokenRowProps {
  readonly title: string;
  readonly value: string | number;
  readonly extras?: string;
}

// Component
const TokenRow: React.FC<TokenRowProps> = React.memo(
  ({ title, value, extras }) => (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm font-medium text-secondary-foreground">{title}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-400">{value}</p>
        {extras && <p className="text-sm font-medium">{extras}</p>}
      </div>
    </div>
  )
);

// Set display name for better debugging
TokenRow.displayName = "TokenRow";

export default TokenRow;
