import { useEffect, useState } from "react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { AccountSelect } from "./AccountSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { formatMoney, getValidAccountId } from "../bankUtils";
import { ArrowRight, DollarSign } from "lucide-react";
import { useBoffSession } from "@/services/useBoffSession";

export function SendMoney() {
    const { session } = useBoffSession();
  const [myAccounts, setMyAccounts] = useState([] as any);
  const [myActiveAccount, setMyActiveAccount] = useState(-1);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [amount, setAmount] = useState(0);
  const [concept, setConcept] = useState("");

  useEffect(() => {
    if (!session) return;
    rotomGET("/starbank/accounts/").then((res) => {
      setAccounts(res);
    });

    rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid).then(
      (res) => {
        setMyAccounts(res);
      }
    );
  }, [session]);

  useEffect(() => {
    if (myAccounts.length === 0) return;
    setMyActiveAccount(getValidAccountId(myAccounts));
  }, [myAccounts, accounts]);

  function sendMoney() {
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
    if (
      amount >
      myAccounts.find((account: any) => account.id === myActiveAccount)?.balance
    ) {
      toast.error("No tienes suficiente saldo");
      return;
    }
    const data = {
      from: myActiveAccount,
      to: activeAccount,
      amount: amount,
      concept: concept,
    };
    rotomPOST("/starbank/transfer", data).then((res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Transferencia realizada");
      setAmount(0);
      setConcept("");

    });
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
            accounts={myAccounts}
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
            accounts={accounts}
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
              <DollarSign className="h-5 w-5 text-main-400" />
            </div>
            <Input
              id="amount"
              type="number"
              min={1}
              max={
                myAccounts.find(
                  (account: any) => account.id === myActiveAccount
                )?.balance
              }
              placeholder="0.00"
              className="pl-10 pr-12"
              onChange={(e) => setAmount(parseInt(e.target.value))}
              value={amount}
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
                myAccounts.find(
                  (account: any) => account.id === myActiveAccount
                )?.balance
              )}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-blue-950">
              Saldo Nuevo
            </span>
            <span className="text-sm font-bold text-blue-950">
              {formatMoney(
                myAccounts.find(
                  (account: any) => account.id === myActiveAccount
                )?.balance - (amount || 0)
              )}
            </span>
          </div>
        </div>
      )}
      <div className="px-6 py-4 bg-main-50 border-t border-main-200">
        <Button
          onClick={sendMoney}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Enviar Dinero
          <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
