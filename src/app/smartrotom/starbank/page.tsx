"use client"

import { BoffSession } from "@/components/smartrotom/AppWrapper"
import { strToDate } from "@/lib/utils"
import { rotomGET } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { use, useEffect, useState } from "react"
import TestChart from "./_components/chart"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select"
import { BankSection, BankSectionButton, BankSectionContent, BankSectionFooter, BankSectionHeader } from "./_components/BankSection"
import { AccountImage } from "./_components/AccountImage"
import { Input } from "@/components/ui/input"

export default function StarBank(){
    const { data: session } = useSession() as {data: BoffSession | null}
    const [accounts, setAccounts] = useState([])
    const [activeAccount, setActiveAccount] = useState({} as any)
    const [transactions, setTransactions] = useState([]);
    const [transfers, setTransfers] = useState([]);

    useEffect(() => {
        if (session?.user) {
            rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setAccounts(res);
                });

            rotomGET("/starbank/transactions/" + session.user.smartRotomUser.uuid +"?limit=10")
                .then((res) => {
                    setTransactions(res);
            });

            rotomGET("/starbank/transfers/" + session.user.smartRotomUser.uuid)
                .then((res) => {
                    setTransfers(res);
                });
        }
    }, [session]);

    useEffect(() => {
        if(accounts.length > 0) {
            setActiveAccount(accounts[0]);
        }
    }, [accounts]);


    function changeAccount(account: number){
        setActiveAccount(accounts.find((acc: any) => acc.id === account));
    }
    
    function GraficaYTal(){
        return(
            
            <div className="flex m-auto h-full">
                <TestChart data={getData()} className="h-full "/>
            </div>
        )
    }

    function getData(){
        const data = transactions.slice().reverse().reduce((acc: any, transaction: any) => {
            const transactionType = transaction.from === activeAccount.id ? "out" : "in";
            const currentBalance = transactionType === "out" ? transaction.fromBalance : transaction.toBalance;
    
            //acc.labels.push(strToDate(transaction.date));
            acc.labels.push("");
            acc.datasets[0].data.push(currentBalance);
            return acc;
        }, {labels: [], datasets: [{data: [], label: "Balance", borderColor: "#3e95cd"}]});
    
        console.log(data);
        return data;
    }

    /*
    background: rgb(23,37,84);
    background: linear-gradient(90deg, rgba(23,37,84,1) 0%, rgba(17,24,39,1) 100%);
    */
    
    return (
        <div className="h-full w-full flex p-8  bg-cover bg-center bg-no-repeat bg-fixed text-blue-950" >
            <section className="h-full flex flex-col justify-start w-1/3 mx-2">
                <BankSection className="h-1/3">
                    <BankSectionHeader >Datos de cuenta </BankSectionHeader>
                    <BankSectionContent>
                    <div className="text-3xl font-bold text-center">Balance</div>
                    <div className="text-4xl 2xl:text-6xl font-bold text-blue-900 text-center ">{Number(activeAccount.balance).toLocaleString('de-DE')} &#165;</div>
                </BankSectionContent>
                    <BankSectionFooter>        
                        <div className="flex flex-row w-full justify-center items-center">
                            <span className="mr-4 text-xs 2xl:text-xl font-bold">Cambiar de Cuenta</span>
                            <SelectCuenta accounts={accounts} activeAccount={activeAccount} setActiveAccount={changeAccount}/>
                        </div>
                    </BankSectionFooter>
                </BankSection>
                <BankSection className="h-full overflow-auto">
                    <BankSectionHeader> Transacciones </BankSectionHeader>
                    <BankSectionContent >
                        <Transactions transactions={transactions} activeAccount={activeAccount} />
                    </BankSectionContent>
                    <BankSectionFooter>
                        <BankSectionButton onClick={() => {console.log("click")}}>Ir a Transacciones</BankSectionButton>
                    </BankSectionFooter>
                </BankSection>
            </section>
            <section className="h-full flex flex-col justify-start w-2/3 mx-2">
                <BankSection className="h-4/5">
                    <BankSectionHeader> Grafica </BankSectionHeader>
                    <BankSectionContent><GraficaYTal /></BankSectionContent>
                    <BankSectionFooter>
                        <BankSectionButton onClick={() => {console.log("click")}}>Ir a Gráficas</BankSectionButton>
                    </BankSectionFooter>
                </BankSection>
                <BankSection className="h-1/5">
                    <BankSectionHeader> Transferencias </BankSectionHeader>
                    <BankSectionContent>
                        <TransfersShort transfers={transfers} activeAccount={activeAccount} />
                    </BankSectionContent>
                    <BankSectionFooter>
                        <BankSectionButton onClick={() => {console.log("click")}}>Ir a Transferencias</BankSectionButton>
                    </BankSectionFooter>
                </BankSection>
            </section>
        </div>

    )
}
/*<SelectCuenta accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount}/>
<Transactions transactions={transactions} activeAccount={activeAccount} className="w-1/2"/>*/




export function SelectCuenta({accounts, activeAccount, setActiveAccount, id}: {accounts: any, activeAccount: any, setActiveAccount: any, id?: string}){
    const [filter, setFilter] = useState("")

    return(
        <Select onValueChange={(e) => setActiveAccount(e)}>
        <SelectTrigger>
            <SelectValue placeholder={activeAccount.name} />
        </SelectTrigger>
        <SelectContent>
            <Input type="text" placeholder="Buscar cuenta" onChange={(e) => setFilter(e.target.value.toLowerCase())} value={filter} id={id}/>
            {accounts.filter((account: any) => account.name.toLowerCase().includes(filter) || account.type.toLowerCase().includes(filter)).map((account: any) => (
                <SelectItem key={account.id} value={account.id}>
                        <div className="flex w-full">
                            <AccountImage width={20} height={20} type={account.type} name={account.name}/>
                            <span className=" ml-2">{account.name}</span>
                    </div>
                </SelectItem>
            ))}
        </SelectContent>
        </Select>
    )
}

export function TransfersShort({transfers, activeAccount}: {transfers: any, activeAccount: any}){
    return(
        <div className="flex justify-evenly ">
            {transfers.map((transfer: any) => {
                const transactionType = transfer.from === activeAccount.id ? "out" : "in";
                const amount = transactionType === "out" ? -transfer.amount : transfer.amount;
                const currentBalance = transactionType === "out" ? transfer.fromBalance : transfer.toBalance;
                const name = transactionType === "out" ? transfer.toName : transfer.fromName;
                const type = transactionType === "out" ? transfer.toType : transfer.fromType;

                return (
                    <div className="flex flex-col justify-center items-center" key={transfer.date} >
                        <div className="flex hover:bg-opacity-50 items-center my-1">
                            <AccountImage width={32} type={type} name={name}/>
                            <div className={`text-right my-auto mx-2 ${esPagador(transfer, activeAccount) ? 'text-red-800' : 'text-green-700'}`}>
                                <div className="font-bold text-xl text-shadow-border05">{amount} &#165;</div>
                            </div>
                        </div>
                        <div className="flex text-sm text-center">{strToDate(transfer.date)} - {name}</div>
                    </div>
                )
            })}
        </div>
    )
}

export function Transactions({transactions, activeAccount, className}: {transactions: any, activeAccount: any, className?: string}){
    if(transactions.length === 0){
        return (
            <div className="h-full p-2 overflow-auto">
                <div className="text-center 2xl:text-2xl font-bold">No hay transacciones</div>
            </div>
        )
    }
    return(
            <div className={`flex flex-col overflow-auto h-full p-2 ${className}`}>
            {transactions.map((transaction: any) => {
                const transactionType = transaction.from === activeAccount.id ? "out" : "in";
                const amount = transactionType === "out" ? -transaction.amount : transaction.amount;
                const currentBalance = transactionType === "out" ? transaction.fromBalance : transaction.toBalance;
                const name = transactionType === "out" ? transaction.toName : transaction.fromName;
                const type = transactionType === "out" ? transaction.toType : transaction.fromType;

                return (
                <div key={transaction.date} className="flex  hover:bg-opacity-50 items-center my-1">
                    <AccountImage type={type} name={name}/>
                    <div className="min-h-9 my-auto mx-4 flex flex-col flex-1">
                        <div className="text-lg font-bold break-all">{transaction.reason}</div>
                        <div className="text-sm ">{strToDate(transaction.date)} - {name}</div>
                    </div>
                    <div className={`text-right my-auto ${esPagador(transaction, activeAccount) ? 'text-red-800' : 'text-green-700'}`}>
                        <div className="font-bold text-xl text-shadow-border05">{amount} &#165;</div>
                        <div className="text-md">{currentBalance} &#165;</div>
                    </div>
                </div>
                )
            })}
            </div>
    )


    

}



function esPagador(transaction: any, activeAccount: any){
    return transaction.from === activeAccount.id;
}
