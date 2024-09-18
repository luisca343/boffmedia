"use client";

import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { strToDate } from "@/lib/utils";
import { rotomGET } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import {
  useEffect,
  useState,
} from "react";
import {
  BankSection,
  BankSectionButton,
  BankSectionContent,
  BankSectionFooter,
  BankSectionHeader,
} from "./_components/BankSection";
import { AccountImage } from "./_components/AccountImage";
import { formatMoney, getActiveAccountBalance } from "./bankUtils";
import { useRouter } from "next/navigation";
import { AccountSelect } from "./_components/AccountSelect";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { ArrowRight, DollarSign, CreditCard, Send, Menu } from "lucide-react";

export default function StarBank() {
  const router = useRouter();
  const { data: session } = useSession() as { data: BoffSession | null };
  const [accounts, setAccounts] = useState([] as any[]);
  const [activeAccount, setActiveAccount] = useState(-1);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    if (session?.user) {
      rotomGET("/starbank/accounts/" + session.user.smartRotomUser.uuid).then(
        (res) => {
          setAccounts(res);
        }
      );
    }
  }, [session]);

  useEffect(() => {
    if (accounts.length > 0) {
      const storedAccount = localStorage.getItem("activeAccount") as string;
      if (storedAccount) {
        changeAccount(
          accounts.find((acc: any) => acc.id === parseInt(storedAccount)).id >=
            0
            ? parseInt(storedAccount)
            : accounts[0].id
        );
      } else {
        setActiveAccount(accounts[0].id);
        localStorage.setItem("activeAccount", accounts[0].id);
      }
    }
  }, [accounts]);

  useEffect(() => {
    if (activeAccount === -1) return;
    rotomGET("/starbank/transactions/" + activeAccount + "?limit=100").then(
      (res) => {
        setTransactions(res);
      }
    );

    rotomGET("/starbank/transfers/" + activeAccount).then((res) => {
      setTransfers(res);
    });
  }, [activeAccount]);

  function changeAccount(account: number) {
    setActiveAccount(account);
    localStorage.setItem("activeAccount", account.toString());
  }

  function getData() {
    const data = transactions
      .slice()
      .reverse()
      .reduce((acc: any, transaction: any) => {
        const transactionType =
          transaction.from === activeAccount ? "out" : "in";
        const currentBalance =
          transactionType === "out"
            ? transaction.fromBalance
            : transaction.toBalance;

        acc.push({
          name: strToDate(transaction.date),
          balance: currentBalance,
        });
        return acc;
      }, []);

    return data;
  }

  

  function TestChart({
    data,
    className,
  }: {
    data?: { name: string; balance: number }[];
    className?: string;
  }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={100}
          height={100}
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: -25,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#1e3a8a"
            fill="#1e3a8a"
            activeDot={{ r: 8 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  function GraficaYTal() {
    return <TestChart data={getData()} className="h-full " />;
  }

  return (
    <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <BankSection className="h-64 max-w-1/3">
          <BankSectionHeader>Balance de cuenta</BankSectionHeader>
          <BankSectionContent>
            <div className="text-4xl 2xl:text-5xl font-bold text-blue-700 ">
              {formatMoney(getActiveAccountBalance(accounts, activeAccount))}
            </div>
          </BankSectionContent>
          <BankSectionFooter>
            <div className="flex flex-col w-full justify-center ">
              <span className="text-xs xl:text-lg text-blue-800">
                Cambiar de Cuenta
              </span>
              <AccountSelect
                accounts={accounts}
                activeAccount={activeAccount}
                setActiveAccount={changeAccount}
              />
            </div>
          </BankSectionFooter>
        </BankSection>

        <BankSection className="h-64">
          <BankSectionHeader> Grafica </BankSectionHeader>
          <BankSectionContent>
            <GraficaYTal />
          </BankSectionContent>
        </BankSection>

        <BankSection className="h-96 overflow-auto md:col-span-2 ">
          <BankSectionHeader> Transacciones </BankSectionHeader>
          <BankSectionContent>
            <Transactions
              trans={transactions}
              activeAccount={activeAccount}
              fecth={false}
            />
          </BankSectionContent>
          <BankSectionFooter>
            <BankSectionButton
              onClick={() => {
                router.push("/smartrotom/starbank/transacciones");
              }}
            >
              Ir a Transacciones <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
            </BankSectionButton>
          </BankSectionFooter>
        </BankSection>
        <div className="md:col-span-2 flex justify-around w-full h-16">
          <button className="flex flex-1 m-2 items-center justify-center px-4 py-6 border border-transparent text-base font-medium rounded-md text-white bg-blue-950 hover:bg-blue-900 md:py-4 md:text-lg md:px-10">
            <DollarSign className="mr-2" /> Transferir Dinero
          </button>
          <button className="flex flex-1 m-2  items-center justify-center px-4 py-6 border border-transparent text-base font-medium rounded-md text-white bg-blue-950 hover:bg-blue-900 md:py-4 md:text-lg md:px-10">
            <CreditCard className="mr-2" /> Administrar Tarjetas
          </button>
          <button className="flex flex-1 m-2  items-center justify-center px-4 py-6 border border-transparent text-base font-medium rounded-md text-white bg-blue-950 hover:bg-blue-900 md:py-4 md:text-lg md:px-10">
            <Send className="mr-2" /> Pagar Facturas
          </button>
        </div>
      </section>
    </div>
  );
}

export function TransfersShort({
  transfers,
  activeAccount,
}: {
  transfers: any;
  activeAccount: any;
}) {
  return (
    <div className="flex justify-evenly flex-wrap ">
      {transfers.map((transfer: any) => {
        const transactionType =
          transfer.from === activeAccount.id ? "out" : "in";
        const amount =
          transactionType === "out" ? -transfer.amount : transfer.amount;
        const currentBalance =
          transactionType === "out" ? transfer.fromBalance : transfer.toBalance;
        const name =
          transactionType === "out" ? transfer.toName : transfer.fromName;
        const type =
          transactionType === "out" ? transfer.toType : transfer.fromType;

        return (
          <div
            className="flex flex-col justify-center items-center"
            key={transfer.date}
          >
            <div className="flex hover:bg-opacity-50 items-center my-1">
              <AccountImage width={32} type={type} name={name} />
              <div
                className={`text-right my-auto mx-2 ${
                  esPagador(transfer, activeAccount)
                    ? "text-red-800"
                    : "text-green-700"
                }`}
              >
                <div className="font-bold text-lg text-shadow-border05">
                  {formatMoney(amount)}
                </div>
              </div>
            </div>
            <div className="flex text-xs text-center">
              {strToDate(transfer.date)} - {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TablaTransacciones({
  transactions,
  activeAccount,
}: {
  transactions: any;
  activeAccount: any;
}) {
  console.log(transactions);
  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50 sticky top-0 z-10">
          <tr>
            <th></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Razón
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction: any) => (
            <tr key={transaction.id}>
              <td className="py-2 whitespace-nowrap text-sm text-blue-900 flex justify-center">
                <AccountImage type={transaction.type} name={transaction.name} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                {transaction.reason}
              </td>
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm ${
                  esPagador(transaction, activeAccount)
                    ? "text-red-800"
                    : "text-green-700"
                }`}
              >
                ¥{transaction.amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                {strToDate(transaction.date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/*
        return (
          <div
            key={transaction.date}
            className="flex  hover:bg-opacity-50 items-center my-1"
          >
            <AccountImage type={type} name={name} />
            <div className="min-h-9 my-auto mx-4 flex flex-col flex-1">
              <div className="text-lg font-bold break-all">
                {transaction.reason}
              </div>
              <div className="text-sm ">
                {strToDate(transaction.date)} - {name}
              </div>
            </div>
            <div
              className={`text-right my-auto ${
                esPagador(transaction, activeAccount)
                  ? "text-red-800"
                  : "text-green-700"
              }`}
            >
              <div className="font-bold text-xl text-shadow-border05">
                {formatMoney(amount)}
              </div>
              <div className="text-md">{formatMoney(currentBalance)}</div>
            </div>
          </div>
        );*/

export function Transactions({
  trans,
  activeAccount,
  className,
  fecth = true,
}: {
  trans: any;
  activeAccount: number;
  className?: string;
  fecth?: boolean;
}) {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    if (!fecth) return setTransactions(trans);
    if (activeAccount === -1) return;
    rotomGET("/starbank/transactions/" + activeAccount + "?limit=100").then(
      (res) => {
        setTransactions(res);
      }
    );
  }, [trans, activeAccount]);

  if (transactions.length === 0) {
    return (
      <div className="h-full p-2 overflow-auto">
        <div className="text-center 2xl:text-2xl font-bold">
          No hay transacciones
        </div>
      </div>
    );
  }
  return (
    <TablaTransacciones
      transactions={transactions}
      activeAccount={activeAccount}
    />
  );
}

function esPagador(transaction: any, activeAccount: any) {
  return transaction.from == activeAccount;
}
