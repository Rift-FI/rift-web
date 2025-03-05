import { JSX } from "react";
import { openLink } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../../hooks/snackbar";
import { ComingSoon } from "../../../assets/icons/actions";
import { colors } from "../../../constants";

export type projectType = {
  images: string[]; // [cover, logo]
  title: string;
  description: string;
  category: string;
  comingSoon: Boolean;
  link: string;
};

export const Project = ({
  images,
  title,
  description,
  comingSoon,
  link,
}: projectType): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();

  const handleClick = () => {
    if (link === "") {
      showsuccesssnack(`${title} coming soon!`);
    } else {
      openLink(link);
    }
  };

  return (
    <div
      className="project"
      style={{ backgroundImage: `url(${images[0]})` }}
      onClick={handleClick}
    >
      <div className="project_cover">
        <div className="project_logo">
          <img src={images[1]} alt={title} />
        </div>

        <div className="about">
          <p>
            {title}
            {comingSoon && (
              <ComingSoon width={14} height={16} color={colors.textprimary} />
            )}
          </p>

          <p className="description">{description}</p>
        </div>
      </div>
    </div>
  );
};
