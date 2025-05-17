import { HomeIcon } from "lucide-react";
import BottomTabs from "./bottom-tabs";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";


export default function AppShell() {
    return (
        <ShellContextProvider>
            <div className="w-screen h-screen flex flex-col items-center bg-app-background" >
                <div  className="flex flex-col w-full flex-1 " >
                    <PageContainer/>
                </div>
                <div className="flex flex-row items-center justify-center px-5 bg-surface-subtle w-full shadow-2xl shadow-surface-subtle " >
                    <BottomTabs/>
                </div>
            </div>
        </ShellContextProvider>
    )
}