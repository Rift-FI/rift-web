import { Profile } from "../../components/tabs/Profile";
import ProfileItem, { ProfileItemProps } from "./ProfileItem";
import airdrop from "../../public/airdrop.webp";
import unlock from "../../public/unlock.webp";
import points from "../../public/points.png";
import Swiper from "../../components/global/Swiper";
import trophy1 from "../../public/trophy1.png";
import trophy2 from "../../public/trophy2.png";
import trophy3 from "../../public/trophy3.png";
import trophy4 from "../../public/trophy4.png";
import Trophy, { TrophyProps } from "./Trophy";

function ProfilePage() {
  const profileItems: ProfileItemProps[] = [
    {
      title: "Airdrops",
      description: "You've airdropped 200 users in the last 30 days.",
      image: airdrop,
    },
    {
      title: "Tokens",
      description: "Your users have unlocked 10,000 USDC so far.",
      image: unlock,
    },
    {
      title: "Points",
      description: "You've distributed 10,000 points to your users.",
      image: points,
    },
  ];
  const trophies: TrophyProps[] = [
    {
      id: 1,
      title: "Airdrop Wizard",
      description: "You've airdropped 200 users in the last 30 days.",
      image: trophy2,
    },

    {
      id: 4,
      title: "The Intergrator",
      description: "Your users have unlocked 10,000 USDC so far.",
      image: trophy1,
    },
    {
      id: 3,
      title: "Newbie",
      description: "You opened a Sphere Business account.",
      image: trophy4,
    },
    {
      id: 2,
      title: "Game Master",
      description: "You've distributed 10,000 points to your users.",
      image: trophy3,
    },
  ];
  return (
    <div className="relative">
      <Profile />
      <h1 className="mt-4 mx-2 font-semibold font-body">My Business Profile</h1>
      <div className="flex flex-col gap-4 mt-2 mb-4">
        {profileItems.map((item) => (
          <ProfileItem profileItem={item} />
        ))}
      </div>
      <h1 className="mt-4 mx-2 font-semibold font-body mb-1">My Trophies</h1>
      <div className="grid grid-cols-2 mb-4 gap-1 mx-2">
        {trophies.map((trophy) => (
          <Trophy key={trophy.id} trophy={trophy} />
        ))}
      </div>

      <Swiper
        swiperTitle="Switch to Personal Profile"
        swiperDescription="Personal Sphere"
        swiperRoute="/"
      />
      <div className="h-16"></div>
    </div>
  );
}

export default ProfilePage;
