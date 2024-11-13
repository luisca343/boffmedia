"use client";
import {  rotomPOST } from "@/services/boffAPI";
import {  useState } from "react";
import {
  BankSection,
  BankSectionContent,
  BankSectionHeader,
} from "../_components/BankSection";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { changeActiveAccount, formatMoney, getValidAccountId } from "../bankUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { AccountImage } from "../_components/AccountImage";
import useStarBank from "../_hooks/useStarBank";
import { useBoffSession } from "@/services/useBoffSession";

export default function Cuentas() {
  const { session } = useBoffSession();
  const {accounts, setAccounts, activeAccount, setActiveAccount} = useStarBank();

  return (
    <div className="flex flex-col w-full h-full p-4">
      <section className="w-1/2 mx-auto  h-full">
        <BankSection className="bg-white overflow-hidden max-h-[80%]">
          <BankSectionHeader>Your Accounts</BankSectionHeader>
          <BankSectionContent>
            <ul className="divide-y divide-gray-200 overflow-auto">
              {accounts.map((account: any) => (
                <li
                  key={account.id}
                  className="p-4 hover:bg-blue-50 transition duration-150 ease-in-out"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <AccountImage type={account.type} name={account.name} />
                      <div>
                        <h3 className="text-lg font-medium text-blue-950">
                          {account.name}
                        </h3>
                        <p className="text-sm text-blue-700">
                          Balance:{" "}
                          <span className="font-semibold">
                            {formatMoney(account.balance)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setActiveAccount(changeActiveAccount(account.id))
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        activeAccount?.id === account.id
                          ? "bg-blue-950 text-white"
                          : "bg-blue-100 text-blue-950 hover:bg-blue-200"
                      }`}
                    >
                      {activeAccount?.id === account.id ? "Selected" : "Select"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </BankSectionContent>
        </BankSection>
        <div className="flex justify-end mt-4">
          <NewAccountDialog />
        </div>
      </section>
    </div>
  );

  function createAccount(name: string = "Nueva Cuenta") {
    rotomPOST("/starbank/accounts/", {
      name,
      uuid: session?.user.smartRotomUser.uuid,
    }).then(() => {
      alert("Cuenta creada");
    });
  }

  function NewAccountDialog() {
    const [accountName, setAccountName] = useState("");
    return (
      <Dialog>
        <DialogTrigger>
          <span
            onClick={() => toast.info("Creando cuenta")}
            className="flex items-center px-6 py-3 bg-blue-950 text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear cuenta
          </span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>Crear cuenta</DialogHeader>
          <DialogDescription>
            <Input
              type="text"
              placeholder="Nombre de la cuenta"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <Button
              className="bg-blue-900 hover:bg-blue-700 text-main-50 mt-2 p-2 rounded-md"
              onClick={() => createAccount(accountName)}
            >
              Crear
            </Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }
}
