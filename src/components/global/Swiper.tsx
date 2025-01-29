import { useNavigate } from "react-router";
import { SwipeableButton } from "react-swipeable-button";

function Swiper({
  swiperTitle,
  swiperDescription,
  swiperRoute,
}: {
  swiperTitle: string;
  swiperDescription: string;
  swiperRoute: string;
}) {
  const navigate = useNavigate();
  function onSuccess() {
    navigate(swiperRoute);
  }
  return (
    <div
      className={`w-full px-4 items-center flex-col justify-center ${
        swiperRoute === "/b2b-suite" ? "absolute bottom-20" : ""
      }`}
    >
      <SwipeableButton
        onSuccess={onSuccess}
        text={swiperTitle}
        text_unlocked={swiperDescription}
        sliderIconColor="#eee"
        background_color="#242d39"
        autoWidth
        textColor="#eee"
        circle
      />
    </div>
  );
}

export default Swiper;
