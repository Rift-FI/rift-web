import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, ReactNode, useContext } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

const tabSchema = z.object({
  tab: z
    .enum(["home", "profile"])
    .default("home")
    .optional(),
});

type TSchema = z.infer<typeof tabSchema>;

interface ShellContext {
  currentTab: TSchema["tab"];
  changeTab: (tab: TSchema["tab"]) => void;
  form: UseFormReturn<TSchema> | null;
}

const shellContext = createContext<ShellContext>({
  changeTab(tab) {},
  currentTab: "home",
  form: null,
});

export default function ShellContextProvider(props: { children: ReactNode }) {
  const { children } = props;
  const form = useForm({
    resolver: zodResolver(tabSchema),
    defaultValues: {
      tab: "home",
    },
  });
  return (
    <shellContext.Provider
      value={{
        form,
        changeTab(tab) {
          form.setValue("tab", tab);
        },
        currentTab: form.watch("tab"),
      }}
    >
      {children}
    </shellContext.Provider>
  );
}

export function useShellContext() {
  const context = useContext(shellContext);

  return context;
}
