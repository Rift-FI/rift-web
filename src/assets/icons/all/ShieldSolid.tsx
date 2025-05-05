import { FC } from "react";
import { iconprops } from "../type";

/**
 * Shield solid
 * width: number (20)
 * height: number (24)
 * color: string (black)
 */
const ShieldSolid: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 20}
    height={height ?? 24}
    viewBox="0 0 20 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 0L0 4.36364V10.9091C0 16.9636 4.26667 22.6255 10 24C15.7333 22.6255 20 16.9636 20 10.9091V4.36364L10 0Z"
      fill={color ?? "black"}
    />
  </svg>
);

export default ShieldSolid;
