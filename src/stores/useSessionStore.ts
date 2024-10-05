import { BoffSession } from "@/types";
import { create } from "zustand";

interface SessionStore {
    session: BoffSession | null;
    sessionStatus: "loading" | "loaded" | "error";
    setSession: (session: BoffSession) => void;
    setStatus: (status: "loading" | "loaded" | "error") => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
    session: null,
    setSession: (session: BoffSession) => set({ session }),
    sessionStatus: "loading",
    setStatus: (sessionStatus: "loading" | "loaded" | "error") => set({ sessionStatus })
}));