import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { BoffSession } from "@/types";

export const useBoffSession = () => {
  const { data: session, status } = useSession() as any;
  const setSession = useSessionStore((state) => state.setSession);
  const setSessionStatus = useSessionStore((state) => state.setStatus);

  useEffect(() => {
    if (session) {
      setSession(session as BoffSession);
    }
  }, [session, setSession]);

  useEffect(() => {
    setSessionStatus(status);
  }, [status, setSessionStatus]);

  function hasRole(role: string | string[]  ) {
    if(Array.isArray(role)){
        return role.some(r => session?.user.roles.includes(r.toUpperCase()));
    }

    return session?.user.roles.includes(role.toUpperCase());
  }

  return { session, status, hasRole } as { session: BoffSession; status: string, hasRole: (role: string | string[]) => boolean };
};
