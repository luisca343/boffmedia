"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionFooter, BankSectionHeader } from "../_components/BankSection";
import { AccountImage } from "../_components/AccountImage";
import { Transactions } from "../page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { SendMoney } from "../_components/SendMoney";

export default function Transacciones(){
    const { data: session } = useSession() as {data: BoffSession | null}
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
            <BankSection className="w-[70%] h-full m-auto">
                <BankSectionHeader >Transacciones </BankSectionHeader>
                <BankSectionContent>
                    <Transactions transactions={transactions} activeAccount={{id: 1}}/>
                </BankSectionContent>
                <BankSectionFooter>
                    <Dialog>
                        <DialogTrigger>
                            <button className="bg-blue-900 hover:bg-blue-700 text-white p-2 rounded-md">Enviar dinero</button>
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