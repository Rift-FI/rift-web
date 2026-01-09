import Lottie from "lottie-react";
import LoadingAnimation from "./loading.json";

interface Props {
  width?: number;
  height?: number;
}

export const Loading = ({ width = 66, height = 66 }: Props) => {
  return (
    <Lottie
      animationData={LoadingAnimation}
      loop={true}
      style={{
        width: width,
        height: height,
      }}
    />
  );
};
