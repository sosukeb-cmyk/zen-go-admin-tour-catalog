"use client";

import { createContext, useContext, useEffect, useState } from "react";

const DEBUG_MODE_STORAGE_KEY = "zengoAdmin:debugMode";

interface DebugModeContextValue {
  debugMode: boolean;
  toggleDebugMode: () => void;
}

const DebugModeContext = createContext<DebugModeContextValue>({
  debugMode: false,
  toggleDebugMode: () => {},
});

export function DebugModeProvider({ children }: { children: React.ReactNode }) {
  /** Starts false (matching the server render) and only reads localStorage
   * client-side after mount — reading it during the initial render would
   * make the client's first pass diverge from the server's and trigger a
   * hydration error. */
  const [debugMode, setDebugMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setDebugMode(window.localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — just stays off.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        DEBUG_MODE_STORAGE_KEY,
        debugMode ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [debugMode, loaded]);

  return (
    <DebugModeContext.Provider
      value={{
        debugMode,
        toggleDebugMode: () => setDebugMode((v) => !v),
      }}
    >
      {children}
    </DebugModeContext.Provider>
  );
}

export function useDebugMode() {
  return useContext(DebugModeContext);
}
