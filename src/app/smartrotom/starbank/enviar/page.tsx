"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { AccountImage } from "../_components/AccountImage";
import { SendMoney } from "../_components/SendMoney";

export default function EnviarDinero(){
    const { data: session } = useSession() as {data: BoffSession | null}

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