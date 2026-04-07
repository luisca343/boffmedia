"use client";
import { useEffect, useState } from "react";
import { useGetAllAccounts } from "@/hooks/starbank/useGetAllAccounts";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useBoffSession } from "@/services/useBoffSession";
import { useTransfer } from "@/hooks/starbank/useTransfer";
import { AccountSelect } from "./AccountSelect";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Button } from "@/components/ui/primitives/button";
import { AccountImage } from "./AccountImage";
import { formatMoney } from "../bankUtils";
import { ExclamationTriangleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { BankSectionButton } from "./BankSection";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { TransactionSuccess } from "./TransactionSuccess";
import { cn } from "@/lib/utils";

interface Account {
  id: number;
  name: string;
  balance: number;
  type: string;
}

interface CreateTransferDto {
  from: number;
  to: number;
  amount: number;
  concept: string;
}

export function SendMoney() {
  const { session } = useBoffSession();
  const [myActiveAccount, setMyActiveAccount] = useState(-1);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { accounts: allAccounts, error: allAccountsError, isLoading: allAccountsLoading } = useGetAllAccounts();
  const { accounts: myAccounts, error: myAccountsError, isLoading: myAccountsLoading } = useGetAccounts(session?.user?.smartRotomUser?.uuid!);
  const { transfer, error: transferError, isLoading: transferLoading } = useTransfer();

  useEffect(() => {
    if (myAccounts && myAccounts.length > 0) {
      setMyActiveAccount(myAccounts[0].id);
    }
  }, [myAccounts]);

  useEffect(() => {
    if (transferError) {
      console.error("Error en transferencia:", transferError);
      setError(transferError);
      setIsSending(false);
      setIsConfirming(false);
    }
  }, [transferError]);

  function validateTransfer() {
    if (activeAccount === -1 || myActiveAccount === -1) {
      setError("Selecciona ambas cuentas");
      return false;
    }
    
    if (activeAccount === myActiveAccount) {
      setError("No puedes transferir dinero a la misma cuenta");
      return false;
    }
    
    if (amount <= 0) {
      setError("El monto debe ser mayor a cero");
      return false;
    }
    
    const myAccount = myAccounts?.find((account: Account) => account.id === myActiveAccount);
    if (!myAccount || amount > myAccount.balance) {
      setError("No tienes suficiente saldo para esta transferencia");
      return false;
    }
    
    setError("");
    return true;
  }

  function handleConfirm() {
    if (validateTransfer()) {
      setIsConfirming(true);
    }
  }

  async function sendMoney() {
    if (!validateTransfer()) return;
    
    setIsSending(true);
    
    try {
      const transferData: CreateTransferDto = {
        from: myActiveAccount,
        to: activeAccount,
        amount: amount,
        concept: concept || "Transferencia",
      };
      
      await transfer(transferData);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error en transferencia:", err);
      setError("Ocurrió un error al realizar la transferencia");
    } finally {
      setIsSending(false);
      setIsConfirming(false);
    }
  }

  function resetForm() {
    setAmount(0);
    setConcept("");
    setActiveAccount(-1);
    setIsSuccess(false);
    setError("");
  }
  

  function handleCancel() {
    setIsConfirming(false);
  }

  if (allAccountsLoading || myAccountsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-700 absolute top-0 left-0"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-blue-900">Cargando información de cuentas...</p>
          <p className="text-sm text-blue-600 mt-1">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (allAccountsError || myAccountsError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{allAccountsError || myAccountsError}</span>
      </div>
    );
  }


  const myAccount = myAccounts?.find((account: Account) => account.id === myActiveAccount);
  const targetAccount = allAccounts?.find((account: Account) => account.id === activeAccount);

  if (isSuccess) {
    return (
      <TransactionSuccess
        amount={amount}
        recipientName={targetAccount?.name || "Usuario"}
        concept={concept}
        onClose={resetForm}
      />
    );
  }


  return (
    <div className="w-full max-w-2xl mx-auto">
      {success && (
        <div className="mb-6 bg-highlight-100 border border-highlight-400 text-highlight-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <CheckIcon className="h-5 w-5 mr-2" />
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {isConfirming ? (
        // Confirmation view
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Confirmar Transferencia</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AccountImage 
                  width={40} 
                  height={40} 
                  type={myAccount?.type || ""} 
                  name={myAccount?.name || ""} 
                  image={(myAccount as any)?.image}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{myAccount?.name}</p>
                  <p className="text-xs text-blue-500">Mi cuenta</p>
                </div>
              </div>
              
              <ArrowRightIcon className="h-5 w-5 text-blue-500" />
              
              <div className="flex items-center">
                <AccountImage 
                  width={40} 
                  height={40} 
                  type={targetAccount?.type || ""} 
                  name={targetAccount?.name || ""} 
                  image={(targetAccount as any)?.image}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{targetAccount?.name}</p>
                  <p className="text-xs text-blue-500">Destinatario</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded border border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-500">Monto</p>
                  <p className="font-medium">{formatMoney(amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Concepto</p>
                  <p className="font-medium">{concept || "Transferencia"}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={transferLoading}
                className="border-blue-200"
              >
                Cancelar
              </Button>
              
              <BankSectionButton 
                onClick={sendMoney} 
                disabled={transferLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {transferLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Procesando...
                  </>
                ) : 'Confirmar Transferencia'}
              </BankSectionButton>
            </div>
          </div>
        </div>
      ) : (
        // Form view
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="from-account" className="mb-2 block text-blue-800">
                Desde mi cuenta
              </Label>
              <div className="space-y-2">
                <AccountSelect
                  accounts={myAccounts}
                  activeAccount={myActiveAccount}
                  setActiveAccount={setMyActiveAccount}
                  id="from-account"
                  className="w-full"
                />
                {myAccount && (
                  <div className="text-sm text-blue-600">
                    Balance disponible: {formatMoney(myAccount.balance)}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="to-account" className="mb-2 block text-blue-800">
                Para cuenta
              </Label>
              <AccountSelect
                accounts={allAccounts}
                activeAccount={activeAccount}
                setActiveAccount={setActiveAccount}
                id="to-account"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="amount" className="mb-2 block text-blue-800">
              Monto a transferir
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">¥</span>
              <Input
                id="amount"
                type="number"
                min={0}
                step={1}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={cn(
                  "pl-8",
                  error && amount <= 0 && "border-red-500 focus:border-red-500"
                )}
                placeholder="0"
                variant={"wingull"}
              />
            </div>
            {myAccount && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-blue-600">
                  Disponible: {formatMoney(myAccount.balance)}
                </span>
                {amount > myAccount.balance && (
                  <span className="text-red-600 font-medium">
                    Fondos insuficientes
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="concept" className="mb-2 block text-blue-800">
              Concepto de la transferencia
            </Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Pago de factura, Regalo, etc."
              maxLength={50}
              variant={"wingull"}
            />
            <p className="text-xs text-blue-500 mt-1">
              {concept.length}/50 caracteres
            </p>
          </div>
          
          <div className="pt-4">
            <BankSectionButton
              onClick={handleConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSending}
            >
              Continuar
            </BankSectionButton>
          </div>
        </div>
      )}
    </div>
  );
}