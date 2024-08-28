import { useEffect, useState } from "react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { useSession } from "next-auth/react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { AccountSelect } from "./AccountSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { formatMoney, getValidAccountId } from "../bankUtils";

export function SendMoney(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [myAccounts, setMyAccounts] = useState([] as any)
    const [myActiveAccount, setMyActiveAccount] = useState(-1)

    const [accounts, setAccounts] = useState([])
    const [activeAccount, setActiveAccount] = useState(-1)

    const [amount, setAmount] = useState(0)
    const [concept, setConcept] = useState("")

    useEffect(() => {
        if (!session) return
            rotomGET("/starbank/accounts/")
                .then((res) => {
                    setAccounts(res);
                });
        
        rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid)
        .then((res) => {
            setMyAccounts(res);
        });
    }, [session]);

    useEffect(() => {
        if (myAccounts.length === 0) return
        setMyActiveAccount(getValidAccountId(myAccounts))
        
    }, [myAccounts, accounts]);
    /*
    useEffect(() => {
        if (accounts.length === 0) return
        setActiveAccount(accounts[0].id)
    }, [accounts]);*/

    function sendMoney(){
        if (activeAccount === -1 || myActiveAccount === -1) {
            toast.error('Selecciona una cuenta')
            return
        }
        if (activeAccount === myActiveAccount) {
            toast.error('No puedes enviar dinero a la misma cuenta')
            return
        }
        if (amount <= 0) {
            toast.error('Ingresa una cantidad válida')
            return
        }
        if(amount > myAccounts.find((account: any) => account.id === myActiveAccount)?.balance) {
            toast.error('No tienes suficiente saldo')
            return
        }
        const data = {
            from: myActiveAccount,
            to: activeAccount,
            amount: amount,
            concept: concept
        }
        rotomPOST("/starbank/transfer", data)
        .then((res) => {
            if(res.error) {
                toast.error(res.error)
                return
            }
            toast.success('Transferencia realizada')
            setAmount(0)
            setConcept("")
        })
    }
    
    return(
            <div className="h-full flex flex-col justify-evenly items-center">
                <section className="flex justify-between items-start w-full">
                    <div className="flex flex-col items-start mx-2 flex-1">
                        <label htmlFor="fromAccount" className="font-bold">Desde</label>
                        <AccountSelect id="fromAccount" accounts={myAccounts} activeAccount={myActiveAccount} setActiveAccount={setMyActiveAccount}/>
                    </div>
                    <div className="flex flex-col items-start mx-2 flex-1">
                        <label htmlFor="toAccount" className="font-bold">Hacia</label>
                        <AccountSelect id="toAccount" accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount}/>
                    </div>
                </section>
                <section className="flex flex-col justify-between items-start w-full mt-2 ">
                    <div className="flex flex-col items-start mx-2 w-full">
                        <label htmlFor="amount" className="font-bold">Cantidad</label>
                        <Input min={1} max= {myAccounts.find((account: any) => account.id === myActiveAccount)?.balance} id="amount" type="number" placeholder="Cantidad" onChange={(e) => setAmount(parseInt(e.target.value))} value={amount}/>
                    </div>
                    <div className="flex flex-col items-start mx-2  w-full">
                        <label htmlFor="concept" className="font-bold">Concepto</label>
                        <Input id="concept" type="text" placeholder="Concepto" onChange={(e) => setConcept(e.target.value)} value={concept}/>
                    </div>
                </section>
                {myActiveAccount != -1 ? 
                <section className="flex justify-center items-center w-full  m-2 p-2 rounded-md">
                        <div className="flex justify-around w-full">
                            <div>
                                <label htmlFor="currentBalance" className="font-bold">Saldo actual</label>
                                <div id="currentBalance" className="text-xl text-center">
                                    {formatMoney(myAccounts.find((account: any) => account.id === myActiveAccount)?.balance) }
                                </div>
                            </div>
                            <div>
                                <label htmlFor="newBalance" className="font-bold">Saldo Nuevo</label>
                                <div id="newBalance" className="text-xl text-center">
                                    {formatMoney(myAccounts.find((account: any) => account.id === myActiveAccount)?.balance - (amount || 0))}
                                </div>
                            </div>
                        </div> 
                </section> : null}
                <Button onClick={() => sendMoney()} className="mt-2 bg-blue-900 hover:bg-blue-700 text-main-50 ">Enviar</Button>
            </div>
    )
}