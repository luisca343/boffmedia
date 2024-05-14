"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionFooter, BankSectionHeader } from "../_components/BankSection";
import { AccountImage } from "../_components/AccountImage";
import { Ban } from "lucide-react";
import { toast } from "react-toastify";

export default function Cuentas(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [accounts, setAccounts] = useState([])
    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setAccounts(res);
                });
        }
    }, [session]);


    return(
        <div className="flex flex-col w-full h-full p-2">
            <BankSection className="w-[50%] h-full m-auto">
                <BankSectionHeader >Cuentas </BankSectionHeader>
                <BankSectionContent>
                    <div className="flex flex-col">
                        {accounts.map((account: any) => (
                            <div key={account.id} className="flex flex-row justify-between p-2 items-center ">
                                <div className="flex items-center">
                                    <AccountImage type={account.type} name={account.name}/>
                                    <div className="pl-2 text-xl">{account.name}</div>
                                </div>
                                <div className="text-xl text-green-600">{Number(account.balance).toLocaleString('de-DE')} &#165;</div>
                            </div>
                        ))}
                    </div>
                </BankSectionContent>
                <BankSectionFooter>
                    <button onClick={() => toast.info('Creando cuenta')} className="bg-blue-900 hover:bg-blue-700 text-white p-2 rounded-md">Crear cuenta</button>
                </BankSectionFooter>
            </BankSection>
        </div>
    )
}