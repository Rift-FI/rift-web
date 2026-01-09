import { ReactNode } from "react";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import "./styles/layout.scss";

interface Props {
  children: ReactNode;
  pageTitle?: string;
}

export default function AppLayout({ children, pageTitle = "Rift" }: Props) {
  return (
    <section id="applayout">
      <DesktopNav />

      <section id="appcontainer">
        <p id="pagetitle">{pageTitle}</p>

        <div id="childcontainer">{children}</div>
      </section>

      <MobileNav />
    </section>
  );
}
