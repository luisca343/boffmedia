"use client";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BankSection,
  BankSectionContent,
  BankSectionFooter,
  BankSectionHeader,
} from "../_components/BankSection";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { changeActiveAccount, getValidAccountId } from "../bankUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { AccountImage } from "../_components/AccountImage";
import { Ban } from "lucide-react";

export default function Cuentas() {
  const { data: session } = useSession() as { data: BoffSession | null };
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(-1);

  useEffect(() => {
    if (session?.user) {
      rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid).then(
        (res) => {
          setAccounts(res);
          setActiveAccount(getValidAccountId(res));
        }
      );
    }
  }, [session]);

  return (
    <div className="flex flex-col w-full h-full p-4">
      <section className="w-1/2 mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-blue-950">
              Your Accounts
            </h2>
          </div>
          <ul className="divide-y divide-gray-200">
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
                          {account.balance} ¥
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveAccount(changeActiveAccount(account.id))
                    }
                    className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      activeAccount === account.id
                        ? "bg-blue-950 text-white"
                        : "bg-blue-100 text-blue-950 hover:bg-blue-200"
                    }`}
                  >
                    {activeAccount === account.id ? "Selected" : "Select"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
