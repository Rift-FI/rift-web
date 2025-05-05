import { FC } from "react";
import { iconprops } from "../type";

/**
 * Log out/Log off/Power off
 * width: number (20)
 * height: number (22)
 * color: string (black)
 */
const LogOut: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 20}
    height={height ?? 22}
    viewBox="0 0 20 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.0235 4.5C3.41269 5.56898 2.1889 7.12823 1.5333 8.94691C0.877706 10.7656 0.825155 12.7471 1.38343 14.5979C1.9417 16.4488 3.08112 18.0707 4.63301 19.2236C6.18489 20.3765 8.06676 20.999 10 20.999C11.9332 20.999 13.8151 20.3765 15.367 19.2236C16.9189 18.0707 18.0583 16.4488 18.6166 14.5979C19.1748 12.7471 19.1223 10.7656 18.4667 8.94691C17.8111 7.12823 16.5873 5.56898 14.9765 4.5M10.0005 1V9"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LogOut;
