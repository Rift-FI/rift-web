export interface ProfileItemProps {
  title: string;
  description: string;
  image: string;
}

function ProfileItem({ profileItem }: { profileItem: ProfileItemProps }) {
  return (
    <div className="mx-[1rem] p-[0.5rem] bg-divider rounded-[0.375rem] flex items-center gap-[0.5rem] py-4">
      <img
        src={profileItem.image}
        alt="profile"
        className="w-[2rem] h-[2rem] rounded-[0.375rem]"
      />
      <div className="flex flex-col">
        <h1 className="font-semibold text-sm font-body">{profileItem.title}</h1>
        <p className="text-muted-foreground text-textsecondary text-xs">
          {profileItem.description}
        </p>
      </div>
    </div>
  );
}

export default ProfileItem;
