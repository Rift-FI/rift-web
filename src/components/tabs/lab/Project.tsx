import { JSX } from "react";
import { openLink } from "@telegram-apps/sdk-react";
import { ComingSoon } from "../../../assets/icons";
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
  category,
  comingSoon,
  link,
}: projectType): JSX.Element => {
  return (
    <div
      className="project"
      style={{ backgroundImage: `url(${images[0]})` }}
      onClick={() => {
        link == "" ? () => {} : openLink(link);
      }}
    >
      <div className="project_cover">
        <div className="project_logo">
          <img src={images[1]} alt="friendsduel" />
        </div>

        <div className="about">
          <p>
            {title}
            {comingSoon && (
              <ComingSoon width={14} height={16} color={colors.textprimary} />
            )}
          </p>

          <p className="description">
            {description}

            <span className="project_category">{category}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
