"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionFooter, BankSectionHeader } from "../_components/BankSection";
import { AccountImage } from "../_components/AccountImage";
import { Ban } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { getValidAccountId, changeActiveAccount } from "../bankUtils";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { a } from "@react-spring/web";

export default function Cuentas(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [accounts, setAccounts] = useState([])
    const [activeAccount, setActiveAccount] = useState(-1)

    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setAccounts(res);
                    setActiveAccount(getValidAccountId(res));
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
                            <div key={account.id} className={`flex flex-row justify-between p-2 items-center ${account.id == activeAccount && 'bg-blue-300'}`}>
                                <div className="flex items-center w-2/5">
                                    <AccountImage type={account.type} name={account.name}/>
                                    <div className="pl-2 text-xl">{account.name}</div>
                                </div>
                                <div className="text-xl text-green-600 w-1/5">{Number(account.balance).toLocaleString('de-DE')} &#165;</div>
                                <div className="text-xl">
                                    <Button onClick={() => setActiveAccount(changeActiveAccount(account.id))} className="bg-blue-900 hover:bg-blue-700 text-main-50 p-2 rounded-md">Seleccionar</Button>
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </BankSectionContent>
                <BankSectionFooter>
                    <NewAccountDialog />
                </BankSectionFooter>
            </BankSection>
        </div>
    )


    function createAccount(name: string = "Nueva Cuenta"){
        rotomPOST('/starbank/accounts/', {name, uuid: session?.user.smartRotomUser.uuid})
            .then(() => {
                alert('Cuenta creada');
            })
    }
    
    function NewAccountDialog(){
        const [accountName, setAccountName] = useState('')
        return(
            <Dialog>
            <DialogTrigger>
                 <span onClick={() => toast.info('Creando cuenta')} className="bg-blue-900 hover:bg-blue-700 text-main-50 p-2 rounded-md">Crear cuenta</span>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>Crear cuenta</DialogHeader>
                <DialogDescription>
                    <Input type="text" placeholder="Nombre de la cuenta"  value={accountName} onChange={(e) => setAccountName(e.target.value)}/>
                    <Button className="bg-blue-900 hover:bg-blue-700 text-main-50 mt-2 p-2 rounded-md"
                        onClick={() => createAccount(accountName)}>Crear</Button>
                </DialogDescription>
            </DialogContent>
        </Dialog>
        )
    }


}