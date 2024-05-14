import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionHeader } from "./BankSection";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { useSession } from "next-auth/react";
import { rotomGET } from "@/services/boffAPI";

export function SendMoney(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [accounts, setAccounts] = useState([])

    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/")
                .then((res) => {
                    setAccounts(res);
                });
        }
    }, [session]);
    
    return(
        <div className="flex flex-col w-full h-full p-2">
            <BankSection className="w-[50%] h-full m-auto">
                <BankSectionHeader >Enviar Dinero </BankSectionHeader>
                <BankSectionContent>
                    <></>
                </BankSectionContent>
            </BankSection>
        </div>
    )
}