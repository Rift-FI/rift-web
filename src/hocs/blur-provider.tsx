import { ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
}

export function installGlobalInputBlur() {
  const shouldBlur = (ev: any) =>
    document.activeElement instanceof HTMLInputElement &&
    !document.activeElement.contains(ev.target);

  ["touchstart", "mousedown"].forEach((type) =>
    window.addEventListener(
      type,
      (ev) => {
        if (shouldBlur(ev)) (document.activeElement as any)?.blur();
      },
      { passive: true }
    )
  );
}

export default function BlurProvider(props: Props) {
  const { children } = props;
  useEffect(() => {
    installGlobalInputBlur();
  }, []);
  return children;
}
