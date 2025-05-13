import { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import { checkServerStatus } from "../utils/api/apistatus";
import "../styles/pages/serverfailure.scss";

export default function ServerFailure(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const { data, isFetching } = useQuery({
    queryKey: ["serverstatus"],
    refetchInterval: 30000,
    queryFn: checkServerStatus,
  });

  const goBack = () => {
    navigate("/app");
    switchtab("home");
  };

  return (
    <section id="serverfailure">
      <p className="_title">Service Unavailable</p>
      <p className="_desc">
        We are currently experiencing technical difficulties and are working
        hard to restore services as quickly as possible. Thank you for your
        patience.
      </p>

      <button disabled={data?.status !== 200 || isFetching} onClick={goBack}>
        We're Back! Tap to Continue
      </button>

      {data?.status == 200 && (
        <p className="min_desc">
          All services have been restored you can <br /> now continue using
          Sphere
        </p>
      )}
    </section>
  );
}
