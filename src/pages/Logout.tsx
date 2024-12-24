import { useEffect } from "react";

export default function Logout() {
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
      }}
    >
      <p style={{ textAlign: "center", fontWeight: "600" }}>
        You have been logged out...
      </p>
    </div>
  );
}
