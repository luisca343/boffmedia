import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getValidAccountId } from "../bankUtils";

export default function useStarBank(){
    const { data: session } = useSession() as { data: BoffSession | null };
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(-1);

    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid).then(
                (res) => {
                    setAccounts(res);
                    setActiveAccount(getValidAccountId(res));
                }
            );
        }
    }, [session]);
    
    console.log({
        accounts,
        setAccounts,
        activeAccount: accounts.find((account: any) => account.id === activeAccount),
        setActiveAccount
    });

    return {
        accounts,
        setAccounts,
        activeAccount: accounts.find((account: any) => account.id === activeAccount),
        setActiveAccount
    }
    
}