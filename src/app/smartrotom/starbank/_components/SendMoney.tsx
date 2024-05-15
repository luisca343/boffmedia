import { useEffect, useState } from "react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { useSession } from "next-auth/react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { SelectCuenta } from "../page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export function SendMoney(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [myAccounts, setMyAccounts] = useState([] as any)
    const [myActiveAccount, setMyActiveAccount] = useState(0)

    const [accounts, setAccounts] = useState([])
    const [activeAccount, setActiveAccount] = useState(0)

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
        console.log(activeAccount)
    }, [activeAccount]);


    function sendMoney(){
        if (activeAccount === 0 || myActiveAccount === 0) {
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
            <section className="flex flex-col justify-between items-center w-full">
            <span>Desde:</span>
            <SelectCuenta accounts={myAccounts} activeAccount={myActiveAccount} setActiveAccount={setMyActiveAccount}/>
            <div className="text-xl">
               {myAccounts.find((account: any) => account.id === myActiveAccount)?.balance}
            </div>
                <span>Hacia:</span>
                <SelectCuenta accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount}/>
            </section>
            <section className="flex flex-col justify-between items-center w-full">
                <Input type="number" placeholder="Cantidad" onChange={(e) => setAmount(parseInt(e.target.value))} value={amount}/>
                <Input type="text" placeholder="Concepto" onChange={(e) => setConcept(e.target.value)} value={concept}/>
            </section>
            <Button onClick={() => sendMoney()} className="bg-blue-900 hover:bg-blue-700 text-white ">Enviar</Button>
        </div>
    )
}