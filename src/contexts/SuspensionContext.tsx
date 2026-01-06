import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate } from "react-router";

interface SuspensionInfo {
  isSuspended: boolean;
  suspendedAt?: string;
  message?: string;
}

interface SuspensionContextType {
  suspensionInfo: SuspensionInfo;
  setSuspended: (info: Omit<SuspensionInfo, "isSuspended">) => void;
  clearSuspension: () => void;
  checkSuspensionResponse: (status: number, data: any) => boolean;
}

const SuspensionContext = createContext<SuspensionContextType | null>(null);

export const useSuspension = () => {
  const context = useContext(SuspensionContext);
  if (!context) {
    throw new Error("useSuspension must be used within SuspensionProvider");
  }
  return context;
};

interface SuspensionProviderProps {
  children: ReactNode;
}

export const SuspensionProvider: React.FC<SuspensionProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [suspensionInfo, setSuspensionInfo] = useState<SuspensionInfo>({
    isSuspended: false,
  });

  const setSuspended = useCallback(
    (info: Omit<SuspensionInfo, "isSuspended">) => {
      console.log("🚫 [Suspension] Account suspended:", info);
      
      // Clear auth tokens
      localStorage.removeItem("token");
      localStorage.removeItem("address");
      
      setSuspensionInfo({
        isSuspended: true,
        ...info,
      });
      
      // Navigate to suspension page
      navigate("/suspended", { replace: true });
    },
    [navigate]
  );

  const clearSuspension = useCallback(() => {
    setSuspensionInfo({ isSuspended: false });
  }, []);

  /**
   * Check if a response indicates account suspension
   * Returns true if suspended (caller should stop processing)
   */
  const checkSuspensionResponse = useCallback(
    (status: number, data: any): boolean => {
      if (status === 403 && data?.message === "Account suspended") {
        setSuspended({
          suspendedAt: data.suspendedAt,
          message: data.error || "Your account has been suspended and cannot access this service.",
        });
        return true;
      }
      return false;
    },
    [setSuspended]
  );

  const value: SuspensionContextType = {
    suspensionInfo,
    setSuspended,
    clearSuspension,
    checkSuspensionResponse,
  };

  return (
    <SuspensionContext.Provider value={value}>
      {children}
    </SuspensionContext.Provider>
  );
};

