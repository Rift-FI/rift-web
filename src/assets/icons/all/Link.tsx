import { FC } from "react";
import { iconprops } from "../type";

/**
 * Link/URL/Hyperlink
 * width: number (24)
 * height: number (12)
 * color: string (black)
 */
const Link: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 24}
    height={height ?? 12}
    viewBox="0 0 24 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.8 12H6C4.34 12 2.9252 11.4148 1.7556 10.2444C0.586001 9.074 0.000800819 7.6592 8.19113e-07 6C-0.000799181 4.3408 0.584401 2.926 1.7556 1.7556C2.9268 0.5852 4.3416 0 6 0H10.8V2.4H6C5 2.4 4.15 2.75 3.45 3.45C2.75 4.15 2.4 5 2.4 6C2.4 7 2.75 7.85 3.45 8.55C4.15 9.25 5 9.6 6 9.6H10.8V12ZM7.2 7.2V4.8H16.8V7.2H7.2ZM13.2 12V9.6H18C19 9.6 19.85 9.25 20.55 8.55C21.25 7.85 21.6 7 21.6 6C21.6 5 21.25 4.15 20.55 3.45C19.85 2.75 19 2.4 18 2.4H13.2V0H18C19.66 0 21.0752 0.5852 22.2456 1.7556C23.416 2.926 24.0008 4.3408 24 6C23.9992 7.6592 23.414 9.0744 22.2444 10.2456C21.0748 11.4168 19.66 12.0016 18 12H13.2Z"
      fill={color ?? "black"}
      fillOpacity="0.6"
    />
  </svg>
);

export default Link;
