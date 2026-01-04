import { useQuery } from "@tanstack/react-query";
import rift from "@/lib/rift";

export interface SailrBalances {
  sailr: number;
  sailrFormatted: string;
  usde: number;
  usdeFormatted: string;
  usdc: number;
  usdcFormatted: string;
}

export function formatTokenBalance(
  amount: number,
  displayDecimals: number = 4
): string {
  try {
    if (!amount || amount === 0) return "0";

    // Handle very small numbers
    if (amount < 0.0001 && amount > 0) {
      return "< 0.0001";
    }

    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    });
  } catch {
    return "0";
  }
}

export default function useSailrBalance() {
  return useQuery({
    queryKey: ["sailr-balances"],
    queryFn: async (): Promise<SailrBalances> => {
      try {
        const authToken = localStorage.getItem("token");

        if (!authToken) {
          console.log("⚓ [Sailr] No auth token, returning zero balances");
          return {
            sailr: 0,
            sailrFormatted: "0",
            usde: 0,
            usdeFormatted: "0",
            usdc: 0,
            usdcFormatted: "0",
          };
        }

        rift.setBearerToken(authToken);

        console.log("⚓ [Sailr] Fetching token balances...");

        // Fetch balances in parallel
        const [sailrResponse, usdeResponse, usdcResponse] = await Promise.all([
          rift.wallet
            .getTokenBalance({
              token: "SAIL" as any,
              chain: "berachain" as any,
            })
            .catch((e) => {
              console.log("⚓ [Sailr] SAIL.R balance fetch failed:", e.message);
              return { data: [] };
            }),
          rift.wallet
            .getTokenBalance({
              token: "USDE" as any,
              chain: "berachain" as any,
            })
            .catch((e) => {
              console.log("⚓ [Sailr] USDe balance fetch failed:", e.message);
              return { data: [] };
            }),
          rift.wallet
            .getTokenBalance({
              token: "USDC" as any,
              chain: "base" as any,
            })
            .catch((e) => {
              console.log("⚓ [Sailr] USDC balance fetch failed:", e.message);
              return { data: [] };
            }),
        ]);

        // Extract balances (amount is already in token units)
        const sailrAmount = sailrResponse.data?.[0]?.amount || 0;
        const usdeAmount = usdeResponse.data?.[0]?.amount || 0;
        const usdcAmount = usdcResponse.data?.[0]?.amount || 0;

        console.log("⚓ [Sailr] Balances fetched:", {
          sailr: sailrAmount,
          usde: usdeAmount,
          usdc: usdcAmount,
        });

        return {
          sailr: sailrAmount,
          sailrFormatted: formatTokenBalance(sailrAmount, 6),
          usde: usdeAmount,
          usdeFormatted: formatTokenBalance(usdeAmount, 2),
          usdc: usdcAmount,
          usdcFormatted: formatTokenBalance(usdcAmount, 2),
        };
      } catch (error) {
        console.error("⚓ [Sailr] Error fetching balances:", error);
        return {
          sailr: 0,
          sailrFormatted: "0",
          usde: 0,
          usdeFormatted: "0",
          usdc: 0,
          usdcFormatted: "0",
        };
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
    retry: false,
  });
}

