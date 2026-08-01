import iriisAvatar from "@/assets/iriis.jpeg";

interface Props {
  size?: number;
  ring?: boolean;
  online?: boolean;
  className?: string;
}

export default function IriisAvatar({
  size = 32,
  ring = false,
  online = false,
  className = "",
}: Props) {
  return (
    <span
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iriisAvatar}
        alt="Iriis"
        width={size}
        height={size}
        draggable={false}
        className={`h-full w-full rounded-full object-cover ${
          ring ? "ring-2 ring-white shadow-[0_2px_8px_rgba(15,42,56,0.12)]" : ""
        }`}
      />
      {online && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
          style={{ height: Math.max(8, size * 0.22), width: Math.max(8, size * 0.22) }}
        />
      )}
    </span>
  );
}
