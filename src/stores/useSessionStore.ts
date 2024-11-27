import { Session } from "next-auth";
import { create } from "zustand";

interface SessionStore {
    session: Session | null;
    sessionStatus: "loading" | "loaded" | "error";
    setSession: (session: Session) => void;
    setStatus: (status: "loading" | "loaded" | "error") => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
    session: null,
    setSession: (session: Session) => set({ session }),
    sessionStatus: "loading",
    setStatus: (sessionStatus: "loading" | "loaded" | "error") => set({ sessionStatus })
}));