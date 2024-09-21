import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { BoffSession } from "@/types";

export const useFetchSession = () => {
  const { data: session, status } = useSession();
  const setSession = useSessionStore((state) => state.setSession);
  const setSessionStatus = useSessionStore((state) => state.setStatus);

  useEffect(() => {
    if (session) {
      setSession(session as BoffSession);
    }
  }, [session, setSession]);
};
