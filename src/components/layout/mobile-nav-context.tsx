"use client";

import { createContext, useContext } from "react";

interface MobileNavContextValue {
  close: () => void;
}

/**
 * Lets a link deep inside a server-rendered sidebar tree close the mobile
 * drawer on navigate, without forcing the whole sidebar to be a Client
 * Component. Context still propagates through Server Component output.
 */
export const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function useCloseMobileNav() {
  const ctx = useContext(MobileNavContext);
  return () => ctx?.close();
}
