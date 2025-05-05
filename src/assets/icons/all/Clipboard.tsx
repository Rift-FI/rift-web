import { FC } from "react";
import { iconprops } from "../type";

/**
 * Clipboard
 * width: number (14)
 * height: number (16)
 * color: string (black)
 */
const Clipboard: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 14}
    height={height ?? 16}
    viewBox="0 0 14 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.66667 2.40137C11.1167 2.40977 11.902 2.47767 12.414 3.01527C13 3.63057 13 4.62037 13 6.59997V10.8C13 12.7803 13 13.7701 12.414 14.3854C11.8287 15 10.8853 15 9 15H5C3.11467 15 2.17133 15 1.586 14.3854C1 13.7694 1 12.7803 1 10.8V6.59997C1 4.62037 1 3.63057 1.586 3.01527C2.098 2.47767 2.88333 2.40977 4.33333 2.40137"
      stroke={color ?? "black"}
      strokeWidth="1.5"
    />
    <path
      d="M4.33334 9.39995H9.66667M3.66667 6.94995H10.3333M5.00001 11.85H9"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.33333 2.05C4.33333 1.77152 4.43868 1.50445 4.62622 1.30754C4.81376 1.11062 5.06811 1 5.33333 1H8.66666C8.93188 1 9.18623 1.11062 9.37377 1.30754C9.56131 1.50445 9.66666 1.77152 9.66666 2.05V2.75C9.66666 3.02848 9.56131 3.29555 9.37377 3.49246C9.18623 3.68938 8.93188 3.8 8.66666 3.8H5.33333C5.06811 3.8 4.81376 3.68938 4.62622 3.49246C4.43868 3.29555 4.33333 3.02848 4.33333 2.75V2.05Z"
      stroke={color ?? "black"}
      strokeWidth="1.5"
    />
  </svg>
);

export default Clipboard;
