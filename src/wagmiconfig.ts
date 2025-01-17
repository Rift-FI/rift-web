import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  base,
  baseSepolia,
  liskSepolia,
  lisk,
  optimism,
  optimismSepolia,
  sepolia,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "RainbowKit App",
  projectId: "a4cf90da4a4a3936ef77d5c5763be78d",
  chains: [
    base,
    baseSepolia,
    liskSepolia,
    lisk,
    optimism,
    optimismSepolia,
    sepolia,
  ],
  ssr: true,
});
