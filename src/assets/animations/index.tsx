import { JSX } from "react";
import Lottie from "lottie-react";
import loadinganim from "./loading.json";
import loadingaltanim from "./loading-alt.json";

export interface animationProps {
  width?: string;
  height?: string;
}

export const Loading = ({
  width = "2rem",
  height = "2rem",
}: animationProps): JSX.Element => {
  return (
    <Lottie
      animationData={loadinganim}
      autoPlay
      loop
      className="animation"
      style={{ width, height }}
    />
  );
};

export const LoadingAlt = ({
  width = "2rem",
  height = "2rem",
}: animationProps): JSX.Element => {
  return (
    <Lottie
      animationData={loadingaltanim}
      autoPlay
      loop
      className="animation"
      style={{ width, height }}
    />
  );
};
