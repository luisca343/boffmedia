"use client"
import { BankSection, BankSectionContent, BankSectionHeader } from "../_components/BankSection";
import { SendMoney } from "../_components/SendMoney";
import { BanknotesIcon, ArrowPathIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function EnviarDinero() {
  const [showRecent, setShowRecent] = useState(false);
  
  return (
    <div className="max-w-[90%] mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main transfer section */}
        <div className="md:col-span-2">
          <BankSection className="h-full">
            <BankSectionHeader>Enviar Dinero</BankSectionHeader>
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                <BanknotesIcon className="h-6 w-6" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-600">
                  Transfiere dinero de forma segura a cualquier cuenta
                </p>
              </div>
            </div>
            <BankSectionContent>
              <SendMoney />
            </BankSectionContent>
          </BankSection>
        </div>
        
        {/* Right sidebar with helpful information */}
        <div className="md:col-span-1">
          <div className="space-y-6">
            {/* Tips section */}
            <BankSection className="bg-secondary-50">
              <BankSectionHeader>Tips de Transferencia</BankSectionHeader>
              <ul className="space-y-3 text-sm text-secondary-700">
                <li className="flex items-start">
                  <span className="mr-2 text-secondary-500">•</span>
                  <span>Verifica siempre el nombre del receptor</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-secondary-500">•</span>
                  <span>Confirma el monto antes de enviar</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-secondary-500">•</span>
                  <span>Las transferencias son instantáneas</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-secondary-500">•</span>
                  <span>Mantén un historial de tus transferencias</span>
                </li>
              </ul>
            </BankSection>
            
            {/* Recent transfers toggle */}
            <BankSection>
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowRecent(!showRecent)}
              >
                <BankSectionHeader>Transferencias Recientes</BankSectionHeader>
                <ArrowPathIcon className="h-5 w-5 text-secondary-600" />
              </div>
              
              {showRecent && (
                <div className="space-y-3 mt-2">
                  <RecentTransferItem 
                    name="Usuario Example"
                    amount="¥2,500"
                    date="23/04/2025"
                  />
                  <RecentTransferItem 
                    name="Shop Minecra"
                    amount="¥590"
                    date="15/04/2025"
                  />
                  <RecentTransferItem 
                    name="Coffee Shop"
                    amount="¥120"
                    date="10/04/2025"
                  />
                </div>
              )}
            </BankSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentTransferItem({ name, amount, date }: { name: string; amount: string; date: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary-50">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
          {name[0]}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-secondary-900">{name}</p>
          <p className="text-xs text-secondary-500">{date}</p>
        </div>
      </div>
      <div className="text-sm font-medium text-red-600">{amount}</div>
    </div>
  );
}