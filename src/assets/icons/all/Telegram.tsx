import { FC } from "react";
import { iconprops } from "../type";

/**
 * Telegram
 * width: number (16)
 * height: number (13)
 * color: string (black)
 */
const Telegram: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 16}
    height={height ?? 13}
    viewBox="0 0 16 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.7011 0.147753L0.525852 5.4517C-0.0445851 5.6987 -0.237523 6.19333 0.387977 6.46177L4.02454 7.58313L12.8173 2.31043C13.2974 1.97942 13.7889 2.06769 13.3659 2.43182L5.81416 9.06635L5.57694 11.8741C5.79666 12.3076 6.19897 12.3096 6.4556 12.0941L8.54491 10.1759L12.1232 12.7758C12.9543 13.2532 13.4065 12.9451 13.5853 12.0701L15.9323 1.28673C16.176 0.209653 15.7605 -0.264917 14.7011 0.147753Z"
      fill={color ?? "black"}
    />
  </svg>
);

export default Telegram;
