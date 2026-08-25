import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ChromeCtx = {
  hidden: boolean;
  setHidden: (v: boolean) => void;
};

const Ctx = createContext<ChromeCtx>({ hidden: false, setHidden: () => {} });

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <Ctx.Provider value={{ hidden, setHidden }}>{children}</Ctx.Provider>;
}

export function useChrome() {
  return useContext(Ctx);
}

/** Hides the gold counter + bottom nav while the component is mounted. */
export function useHideChrome(active = true) {
  const { setHidden } = useChrome();
  useEffect(() => {
    if (!active) return;
    setHidden(true);
    return () => setHidden(false);
  }, [active, setHidden]);
}
