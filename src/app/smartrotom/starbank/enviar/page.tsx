"use client"
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { SendMoney } from "../_components/SendMoney";
import { useBoffSession } from "@/services/useBoffSession";

export default function EnviarDinero(){

    return(
        <div className="flex flex-col w-full h-full mt-6 p-2 items-center">
            <BankSection className=" self-center align-middle w-[50%] ">
                <BankSectionHeader >Enviar Dinero </BankSectionHeader>
                <BankSectionContent>
                    <SendMoney />
                </BankSectionContent>
            </BankSection>
        </div>
    )
}