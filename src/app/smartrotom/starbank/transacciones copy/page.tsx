"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { useBoffSession } from "@/services/useBoffSession";

export default function Cuentas(){
    const { session } = useBoffSession();
    const [transactions, setTransactions] = useState([])
    
    useEffect(() => {
        if (session?.user) {

            rotomGET("/starbank/transactions/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setTransactions(res);
            });
        }
    }, [session]);


    return(
        <div className="flex flex-col w-full h-full p-2">
            <BankSection className="w-[50%] h-full m-auto">
                <BankSectionHeader >Transacciones </BankSectionHeader>
                <BankSectionContent>
                    <></>
                </BankSectionContent>
            </BankSection>
        </div>
    )
}