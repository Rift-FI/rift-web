import BottomTabs from "./bottom-tabs";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";
import Onboarding from "@/features/onboarding";
import { Routes } from "react-router";


export default function AppShell() {
  return (
    <ShellContextProvider>
      <div className="w-screen h-screen flex flex-col items-center bg-app-background relative" >
        <PageContainer />
      </div>
    </ShellContextProvider>
  )
}