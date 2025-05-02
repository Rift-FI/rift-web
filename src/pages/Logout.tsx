import { useEffect } from "react";
import { useNavigate } from "react-router";
import { SubmitButton } from "@/components/global/Buttons";
import { colors } from "@/constants";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: colors.primary,
      }}
    >
      <p style={{ textAlign: "center", fontWeight: "600" }}>
        You have been logged out...
      </p>

      <SubmitButton
        text="Sign in Again"
        sxstyles={{
          marginTop: "1rem",
          padding: "0.5rem",
          borderRadius: "0.625rem",
        }}
        onclick={() => navigate("/auth")}
      />
    </div>
  );
}
