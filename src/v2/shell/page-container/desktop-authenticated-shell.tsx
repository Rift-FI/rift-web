import { ReactNode } from "react";
import DesktopShell from "../desktop-shell";

interface Props {
  children: ReactNode;
}

export default function DesktopAuthenticatedShell(props: Props) {
  const { children } = props;
  
  return <DesktopShell>{children}</DesktopShell>;
}
