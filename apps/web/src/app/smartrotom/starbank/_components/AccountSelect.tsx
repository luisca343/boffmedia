import { useState } from "react";
import { AccountImage } from "./AccountImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Input } from "@/components/ui/primitives/input";



export function AccountSelect({accounts, activeAccount, setActiveAccount, id, className}: {accounts: any, activeAccount: any, setActiveAccount: any, id?: string, className?: string}) {
    const [filter, setFilter] = useState("")
    const filteredAccounts = accounts.filter((account: any) => account.name.toLowerCase().includes(filter) || account.type.toLowerCase().includes(filter))

    function getAccount(index: number){
        const account = filteredAccounts[index];
        return <div className="flex w-full">
            <AccountImage width={20} height={20} type={account.type} name={account.name} image={(account as any).image}/>
            <span className=" ml-2">{account.name}</span>
            </div>
    }

    function getCurrentAccount(){
        const storedAccount = localStorage.getItem("activeAccount") || accounts[0].id;
        return getAccount(filteredAccounts.findIndex((account: any) => account.id === parseInt(storedAccount)));
    }

    if(filteredAccounts.length === 0) return <></>
    return(
        <Select onValueChange={(e) => setActiveAccount(e)} variant="wingull"> 
        <SelectTrigger>
            <SelectValue placeholder={getCurrentAccount()} />
        </SelectTrigger>
        <SelectContent>
            <Input type="text" placeholder="Buscar cuenta" onChange={(e) => setFilter(e.target.value.toLowerCase())} value={filter} id={id} variant="wingull" className="hover:bg-blue-400/30"/>
            {filteredAccounts.map((account: any) => (
                <SelectItem key={account.id} value={account.id}>
                    {getAccount(accounts.indexOf(account))}
                </SelectItem>
            ))}
        </SelectContent>
        </Select>
    )
}