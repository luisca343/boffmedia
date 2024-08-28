"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionFooter, BankSectionHeader } from "../_components/BankSection";
import { Transactions } from "../page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { SendMoney } from "../_components/SendMoney";
import { getValidAccountId } from "../bankUtils";

export default function Transacciones(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [transactions, setTransactions] = useState([])
    const [accounts, setAccounts] = useState([])
    const [activeAccount, setActiveAccount] = useState(-1)
    
    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setAccounts(res);
                });

        }
    }, [session]);

    useEffect(() => {
        if (accounts.length === 0) return
        const account = getValidAccountId(accounts)
        setActiveAccount(account)

        rotomGET("/starbank/transactions/" + account)
        .then((res) => {
            setTransactions(res);
    });
    }, [accounts]);


    if(accounts.length === 0) return <div>Cargando...</div>
    return(
        <div className="flex flex-col w-full h-full p-2">
            <BankSection className="w-[70%] h-full m-auto">
                <BankSectionHeader >Transacciones </BankSectionHeader>
                <BankSectionContent>
                    <Transactions activeAccount={getValidAccountId(accounts)} />
                </BankSectionContent>
                <BankSectionFooter>
                    <Dialog>
                        <DialogTrigger>
                            <div className="bg-blue-900 hover:bg-blue-700 text-main-50 p-2 rounded-md">Enviar dinero</div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>Enviar dinero</DialogHeader>
                            <DialogDescription>
                                <SendMoney />
                            </DialogDescription>
                        </DialogContent>
                    </Dialog>
                </BankSectionFooter>
            </BankSection>
        </div>
    )
}