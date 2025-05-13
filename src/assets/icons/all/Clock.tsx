import { FC } from "react";
import { iconprops } from "../type";

/**
 * Clock
 * width: number (20)
 * height: number (20)
 * color: string (black)
 */
const Wallet: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 20}
    height={height ?? 20}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 19C14.9707 19 19 14.9707 19 10C19 5.0293 14.9707 1 10 1C5.0293 1 1 5.0293 1 10C1 14.9707 5.0293 19 10 19Z"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.0072 8.6572C9.64918 8.6572 9.30581 8.79943 9.05263 9.05261C8.79946 9.30578 8.65723 9.64916 8.65723 10.0072C8.65723 10.3652 8.79946 10.7086 9.05263 10.9618C9.30581 11.215 9.64918 11.3572 10.0072 11.3572C10.3653 11.3572 10.7086 11.215 10.9618 10.9618C11.215 10.7086 11.3572 10.3652 11.3572 10.0072C11.3572 9.64916 11.215 9.30578 10.9618 9.05261C10.7086 8.79943 10.3653 8.6572 10.0072 8.6572ZM10.0072 8.6572V5.5M12.7135 12.718L10.9594 10.9648"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Wallet;
