export interface TrophyProps {
  id: number;
  title: string;
  description: string;
  image: string;
}

function Trophy({ trophy }: { trophy: TrophyProps }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center mt-1 bg-divider rounded-xl">
      <img src={trophy.image} alt="trophy" className="rounded-xl" />
      <div className="flex flex-col p-2">
        <h1 className="text-textprimary text-sm font-body font-bold">
          {trophy.title}
        </h1>
        <p className="text-gray-400 text-xs font-semibold leading-relaxed">
          {trophy.description}
        </p>
      </div>
    </div>
  );
}

export default Trophy;
