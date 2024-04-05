"use client"

import { BoffSession } from "@/components/smartrotom/AppWrapper"
import { strToDate } from "@/lib/utils"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { use, useEffect, useState } from "react"
import { SideMenu } from "./_components/SideMenu"
import Chart from 'chart.js/auto';
import TestChart from "./_components/chart"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BankSection, BankSectionButton, BankSectionContent, BankSectionFooter, BankSectionHeader } from "./_components/BankSection"

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

            rotomGET("/starbank/transactions/" + session.user.smartRotomUser.uuid)
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
        <div className="w-full h-full flex flex-col p-8  bg-cover bg-center bg-no-repeat bg-fixed" >
            <div className="w-full flex flex-1 justify-evenly">
                <BankSection className="w-2/3">
                    <BankSectionHeader >Datos de cuenta </BankSectionHeader>
                    <BankSectionContent>
                    <div className="text-3xl font-bold text-center">Balance</div>
                    <div className="text-7xl font-bold text-blue-900 text-center ">{Number(activeAccount.balance).toLocaleString('de-DE')} &#165;</div>
                    <SelectCuenta accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount}/>
                </BankSectionContent>
                    <BankSectionFooter>
                        <BankSectionButton onClick={() => {console.log("click")}}>Ver todas</BankSectionButton>
                    </BankSectionFooter>
                </BankSection>
                <BankSection className="w-1/3">
                    <BankSectionHeader> Grafica </BankSectionHeader>
                    <BankSectionContent><GraficaYTal /></BankSectionContent>
                    <BankSectionFooter>
                        <BankSectionButton onClick={() => {console.log("click")}}>Ir a Gráficas</BankSectionButton>
                    </BankSectionFooter>
                </BankSection>
            </div>
            <div className="w-full overflow-hidden flex flex-1 my-2 justify-evenly">
            <BankSection  className="w-3/5">
                <BankSectionHeader> Transacciones </BankSectionHeader>
                <BankSectionContent>
                    <Transactions transactions={transactions} activeAccount={activeAccount} />
                </BankSectionContent>
                <BankSectionFooter>
                    <BankSectionButton onClick={() => {console.log("click")}}>Ir a Transacciones</BankSectionButton>
                </BankSectionFooter>
            </BankSection>
            <BankSection  className="w-2/5">
                <BankSectionHeader> Transferencias </BankSectionHeader>
                <BankSectionContent>
                    <Transactions transactions={transfers} activeAccount={activeAccount} />
                </BankSectionContent>
                <BankSectionFooter>
                    <BankSectionButton onClick={() => {console.log("click")}}>Ir a Transferencias</BankSectionButton>
                </BankSectionFooter>
            </BankSection>
            </div>
        </div>

    )
}
/*<SelectCuenta accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount}/>
<Transactions transactions={transactions} activeAccount={activeAccount} className="w-1/2"/>*/




export function SelectCuenta({accounts, activeAccount, setActiveAccount}: {accounts: any, activeAccount: any, setActiveAccount: any}){

    return(
        <Select>
        <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={activeAccount.name} />
        </SelectTrigger>
        <SelectContent>
            {accounts.map((account: any) => (
                <SelectItem key={account.id} value={account.name} onSelect={() => setActiveAccount(account)}>{account.name}</SelectItem>
            ))}
        </SelectContent>
        </Select>
    )
}


export function Transactions({transactions, activeAccount, className}: {transactions: any, activeAccount: any, className?: string}){
    if(transactions.length === 0){
        return (
            <div className="h-full p-2">
                <div className="text-center text-2xl font-bold">No hay transacciones</div>
            </div>
        )
    }
    return(

            <div className="overflow-auto h-full p-2">
            {transactions.map((transaction: any) => {
                const transactionType = transaction.from === activeAccount.id ? "out" : "in";
                const amount = transactionType === "out" ? -transaction.amount : transaction.amount;
                const currentBalance = transactionType === "out" ? transaction.fromBalance : transaction.toBalance;
                const name = transactionType === "out" ? transaction.toName : transaction.fromName;
                const url = getImageURL(transactionType === "out" ? 
                    {type:transaction.toType, name: transaction.toName} : 
                    {type:transaction.fromType, name: transaction.fromName}
                );

                return (
                <div key={transaction.date} className="flex  hover:bg-opacity-50 items-center">
                    <Image width={48} height={48} className="w-12 " src={url} alt={`Image of ${name}`} />
                    <div className="min-h-9 my-auto mx-4 flex flex-col flex-1">
                        <div className="text-lg font-bold break-all">{transaction.reason}</div>
                        <div className="text-sm ">{strToDate(transaction.date)} - {name}</div>
                    </div>
                    <div className={`text-right my-auto ${esPagador(transaction, activeAccount) ? 'text-red-700' : 'text-green-700'}`}>
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

function getImageURL(account: {type: string, name: string}){
    if(account.type === "EMPRESA"){
        return `/smartrotom/img/starbank/cuentas/${account.name.toLowerCase()}.png`
    } else {
        return `https://minotar.net/avatar/${account.name}/80.png`
    }
}
