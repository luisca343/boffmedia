import { useEffect, useState } from "react";
import { AccountSelect } from "./AccountSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { formatMoney, getValidAccountId } from "../bankUtils";
import { ArrowRight, JapaneseYen } from 'lucide-react';
import { useBoffSession } from "@/services/useBoffSession";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useGetAllAccounts } from "@/hooks/starbank/useGetAllAccounts";
import { useTransfer } from "@/hooks/starbank/useTransfer";
import { CreateTransferDto } from "@/types/dto/create-transfer-dto";
import { Account } from "@/services/api/smartrotom/usersService";

export function SendMoney() {
  const { session } = useBoffSession();
  const [myActiveAccount, setMyActiveAccount] = useState(-1);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");

  const { accounts: allAccounts, error: allAccountsError, isLoading: allAccountsLoading } = useGetAllAccounts();
  const { accounts: myAccounts, error: myAccountsError, isLoading: myAccountsLoading } = useGetAccounts(session?.user?.smartRotomUser?.uuid!);
  const { transfer, error: transferError, isLoading: transferLoading } = useTransfer();

  useEffect(() => {
    if (myAccounts && myAccounts.length > 0) {
      setMyActiveAccount(getValidAccountId(myAccounts));
    }
  }, [myAccounts]);

  async function sendMoney() {
    if (activeAccount === -1 || myActiveAccount === -1) {
      toast.error("Selecciona una cuenta");
      return;
    }
    if (activeAccount === myActiveAccount) {
      toast.error("No puedes enviar dinero a la misma cuenta");
      return;
    }
    if (amount <= 0) {
      toast.error("Ingresa una cantidad válida");
      return;
    }
    const myAccount = myAccounts?.find((account: Account) => account.id === myActiveAccount);
    if (!myAccount || amount > myAccount.balance) {
      toast.error("No tienes suficiente saldo");
      return;
    }

    const transferData: CreateTransferDto = {
      from: myActiveAccount,
      to: activeAccount,
      amount: amount,
      concept: concept,
    };

    try {
      await transfer(transferData);
      toast.success("Transferencia realizada");
      setAmount(0);
      setConcept("");
    } catch (error) {
      toast.error("Error al realizar la transferencia");
    }
  }

  if (allAccountsLoading || myAccountsLoading) {
    return <div>Cargando...</div>;
  }

  if (allAccountsError || myAccountsError) {
    return <div>Error al cargar las cuentas</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="fromAccount"
            className="block text-sm font-medium text-blue-950"
          >
            Desde
          </label>
          <AccountSelect
            id="fromAccount"
            accounts={myAccounts || []}
            activeAccount={myActiveAccount}
            setActiveAccount={setMyActiveAccount}
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label
            htmlFor="toAccount"
            className="block text-sm font-medium text-blue-950"
          >
            Hacia
          </label>
          <AccountSelect
            id="toAccount"
            accounts={allAccounts || []}
            activeAccount={activeAccount}
            setActiveAccount={setActiveAccount}
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-blue-950"
          >
            Cantidad
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <JapaneseYen className="h-5 w-5 text-blue-900" />
            </div>
            <Input
              id="amount"
              type="number"
              min={1}
              max={myAccounts?.find((account: Account) => account.id === myActiveAccount)?.balance}
              placeholder="0.00"
              className="pl-10"
              onChange={(e) => setAmount(parseInt(e.target.value))}
              value={amount}
              variant={"wingull"}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="concept"
            className="block text-sm font-medium text-blue-950"
          >
            Concepto
          </label>
          <Input
            id="concept"
            type="text"
            placeholder="Concepto"
            className="mt-1 block w-full"
            onChange={(e) => setConcept(e.target.value)}
            value={concept}
            variant={"wingull"}
          />
        </div>
      </div>

      {myActiveAccount !== -1 && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-950">
              Saldo actual
            </span>
            <span className="text-sm font-bold text-blue-950">
              {formatMoney(
                myAccounts?.find(
                  (account: Account) => account.id === myActiveAccount
                )?.balance!
              )}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-blue-950">
              Saldo Nuevo
            </span>
            <span className="text-sm font-bold text-blue-950">
              {formatMoney(
                (myAccounts?.find(
                  (account: Account) => account.id === myActiveAccount
                )?.balance || 0) - (amount || 0)
              )}
            </span>
          </div>
        </div>
      )}
      <div className="px-6 py-4 bg-surface-50 border-t border-surface-200">
        <Button
          onClick={sendMoney}
          disabled={transferLoading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {transferLoading ? 'Enviando...' : 'Enviar Dinero'}
          <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

