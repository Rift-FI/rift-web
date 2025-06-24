import { useEffect, useState } from "react";
import { useFlow } from "../context";
import sphere from "@/lib/sphere";
import spherelogo from "@/assets/sphere.png";
import { useNavigate } from "react-router";
import { CgSpinner } from "react-icons/cg";
import { usePlatformDetection } from "@/utils/platform";
import MigrationDialog from "../components/migration-dialog";

export default function AuthCheck() {
  const flow = useFlow();
  const navigate = useNavigate();
  const { isTelegram } = usePlatformDetection();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  useEffect(() => {
    const auth_token = localStorage.getItem("token");
    const address = localStorage.getItem("address");
    const isNewVersion = localStorage.getItem("isNewVersion");

    // If user is already authenticated, go to app
    if (auth_token && address) {
      sphere.setBearerToken(auth_token);
      navigate("/app");
      return;
    }

    // Check if migration is needed
    if (!isNewVersion) {
      if (isTelegram) {
        // Show migration dialog for Telegram users
        setShowMigrationDialog(true);
      } else {
        // For browser users, proceed to normal flow but they'll see info in migration dialog
        setShowMigrationDialog(true);
      }
    } else {
      // User has already migrated or is new, proceed to normal flow
      flow.goToNext("start");
    }
  }, [isTelegram, flow, navigate]);

  const handleRecoverV1 = () => {
    setShowMigrationDialog(false);
    if (isTelegram) {
      flow.goToNext("v1-recovery");
    } else {
      // For browser users, just go to start and they can create new account
      flow.goToNext("start");
    }
  };

  const handleCreateNew = () => {
    setShowMigrationDialog(false);
    // Set the flag to indicate they chose to create new account
    localStorage.setItem("isNewVersion", "true");
    flow.goToNext("start");
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full h-full gap-2">
        <img src={spherelogo} className="w-[80px] h-[80px]" />
        <div className="flex flex-row items-center gap-2">
          <p className="text-muted-foreground font-semibold">
            Initializing Sphere
          </p>
          <CgSpinner className="text-accent-secondary animate-spin" />
        </div>
      </div>

      <MigrationDialog
        isOpen={showMigrationDialog}
        onRecoverV1={handleRecoverV1}
        onCreateNew={handleCreateNew}
      />
    </>
  );
}
