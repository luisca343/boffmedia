"use client"
import useStarBank from "../_hooks/useStarBank";
import { AccountImage } from "./AccountImage";
import { useBoffSession } from "@/services/useBoffSession";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { changeActiveAccount, formatMoney } from "../bankUtils";
import { StarBankAccount } from "@/types/starbank";
import { InternalLink } from "@/components/nav/Link";

export default function TopBar({
  currentPage,
}: Readonly<{ currentPage: string }>) {
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const { session } = useBoffSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const capitalizeFirstLetter = (string: string) => {
    if (string === "starbank") return "Dashboard";
    if (string === "enviar") return "Enviar Dinero";
    if (string === "graficas") return "Gráficas";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  // Handle account change
  const handleAccountChange = (account: StarBankAccount) => {
    if (account && account.id) {
      // Save to localStorage and update state
      changeActiveAccount(account.id);
      setActiveAccount(account.id);
      setShowDropdown(false);
    }
  };

  return (
    <header className="bg-blue-200 shadow-sm border-b border-blue-300">
      <div className="h-20 mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {capitalizeFirstLetter(currentPage)}
        </h1>
        <div className="flex items-center relative" ref={dropdownRef}>
          {activeAccount && (
            <div 
              className="flex items-center gap-3 cursor-pointer bg-blue-100 hover:bg-blue-300 transition-colors duration-200 px-4 py-2 rounded-full"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-blue-950">{session?.user?.name || "Usuario"}</p>
                <p className="text-xs text-blue-800">{activeAccount.name}</p>
              </div>
              <AccountImage width={40} height={40} type={activeAccount.type} name={activeAccount.name}/>
              <ChevronDownIcon className="h-4 w-4 text-blue-800" />
            </div>
          )}
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-2">
              {/* User section */}
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-blue-950">{session?.user?.name || "Usuario"}</p>
                <p className="text-xs text-blue-500">Cambiar cuenta</p>
              </div>
              
              {/* Accounts section */}
              <div className="max-h-60 overflow-y-auto py-1">
                {accounts && accounts.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {accounts.map((account: StarBankAccount) => (
                      <div
                        key={account.id}
                        className={`flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer ${
                          activeAccount.id === account.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleAccountChange(account)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <AccountImage 
                            width={32} 
                            height={32} 
                            type={account.type} 
                            name={account.name}
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-blue-900">{account.name}</p>
                          <p className="text-xs text-blue-600">{formatMoney(account.balance)}</p>
                        </div>
                        {activeAccount.id === account.id && (
                          <div className="flex-shrink-0 ml-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-500">No hay cuentas disponibles</p>
                )}
              </div>
              
              {/* Actions section */}
              <div className="border-t border-gray-200 pt-1">
                <InternalLink href="/starbank/cuentas" className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-100">
                  Gestionar Cuentas
                </InternalLink>
                <InternalLink href="/" className="block px-4 py-2 text-sm text-red-600 hover:bg-blue-100">
                  Cerrar sesión
                </InternalLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}