import { Link } from "react-router";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <p className="font-semibold text-accent-primary">Home</p>
      <Link to="/token">
        <p className="font-semibold text-accent-primary">Token Details</p>
      </Link>
    </div>
  );
}
