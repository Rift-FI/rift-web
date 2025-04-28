import { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTabs } from "@/hooks/tabs";
import { checkServerStatus } from "@/utils/api/apistatus";
import { SubmitButton } from "@/components/global/Buttons";
import "@/styles/pages/serverfailure.scss";

export default function ServerFailure(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const { data, isPending } = useQuery({
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

      <SubmitButton
        text="We're Back! Tap to Continue"
        sxstyles={{
          marginTop: "1rem",
          padding: "0.5rem",
          borderRadius: "2rem",
        }}
        onclick={goBack}
        isLoading={data?.status !== 200 || isPending}
        isDisabled={data?.status !== 200 || isPending}
      />
      {data?.status == 200 && (
        <p className="min_desc">
          All services have been restored you can <br /> now continue using
          Sphere
        </p>
      )}
    </section>
  );
}
