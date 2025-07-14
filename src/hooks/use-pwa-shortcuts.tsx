import { useEffect } from "react";
import { useNavigate } from "react-router";
import { handleShortcutNavigation } from "@/utils/pwa-shortcuts";

export const usePWAShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    handleShortcutNavigation(navigate);
  }, [navigate]);
};
