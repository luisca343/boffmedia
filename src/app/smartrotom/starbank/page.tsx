"use client";
import { strToDate } from "@/lib/utils";
import { useEffect, useState } from "react";
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
import {
  AreaChart,
  Area,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ArrowRight, DollarSign, CreditCard, Send } from 'lucide-react';
import { useBoffSession } from "@/services/useBoffSession";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { useGetTransfers } from "@/hooks/starbank/useGetTransfers";
import { Transaction } from "@/types/starbank";
import { InternalLink } from "@/components/ui/navigation/Link";
import { DashboardSkeleton } from "./_components/DashBoardSkeleton";
import { StarBankTransaction } from "@/generated/api";

export default function StarBank() {
  const router = useRouter();
  const { session } = useBoffSession();
  const [activeAccount, setActiveAccount] = useState(-1);

  const { accounts, error: accountsError, isLoading: accountsLoading } = useGetAccounts(session?.user?.smartRotomUser?.uuid || '');
  const { transactions, error: transactionsError, isLoading: transactionsLoading } = useGetTransactions(activeAccount, 100);
  const { transfers, error: transfersError, isLoading: transfersLoading } = useGetTransfers(activeAccount);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const storedAccount = localStorage.getItem("activeAccount") as string;
      if (storedAccount) {
        changeAccount(
          accounts.find((acc: any) => acc.id === parseInt(storedAccount))?.id! >= 0
            ? parseInt(storedAccount)
            : accounts[0].id
        );
      } else {
        setActiveAccount(accounts[0].id);
        localStorage.setItem("activeAccount", accounts[0].id.toString());
      }
    }
  }, [accounts]);

  function changeAccount(account: number) {
    setActiveAccount(account);
    localStorage.setItem("activeAccount", account.toString());
  }

  function getData() {
    return transactions
      ?.slice()
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
      }, []) || [];
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
            fill="#3b82f6"
            activeDot={{ r: 8 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  function GraficaYTal() {
    return <TestChart data={getData()} className="h-full " />;
  }

  if (accountsLoading || transactionsLoading || transfersLoading) {
    return <DashboardSkeleton />;
  }

  if (accountsError || transactionsError || transfersError) {
    return <div>Error: {accountsError || transactionsError || transfersError}</div>;
  }

  return (
    <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <BankSection className="h-64 md:col-span-1">
          <BankSectionHeader>Balance de cuenta</BankSectionHeader>
          <BankSectionContent>
            <div className="flex flex-col h-full justify-center">
              <div className="text-4xl 2xl:text-5xl font-bold text-blue-700">
                {formatMoney(getActiveAccountBalance(accounts!, activeAccount))}
              </div>
              <div className="text-sm text-blue-500 mt-2">
                Cuenta {accounts?.find((acc: any) => acc.id === activeAccount)?.name || "Principal"}
              </div>
            </div>
          </BankSectionContent>
          <BankSectionFooter>
            <div className="flex flex-col w-full justify-center">
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
  
        {/* Chart Card */}
        <BankSection className="h-64 md:col-span-2">
          <BankSectionHeader>Movimientos Recientes</BankSectionHeader>
          <BankSectionContent>
            <GraficaYTal />
          </BankSectionContent>
        </BankSection>
  
        {/* Quick Actions */}
        <BankSection className="md:col-span-3">
          <BankSectionHeader>Acciones Rápidas</BankSectionHeader>
          <BankSectionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InternalLink 
                href="starbank/enviar" 
                className="group relative overflow-hidden flex flex-1 items-center justify-center p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <DollarSign className="text-blue-700 h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold block">Transferir Dinero</span>
                    <span className="text-blue-600 text-sm">Envía dinero rápidamente</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
              </InternalLink>
              
              <InternalLink 
                href="starbank/cuentas" 
                className="group relative overflow-hidden flex flex-1 items-center justify-center p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="text-blue-700 h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold block">Administrar Cuentas</span>
                    <span className="text-blue-600 text-sm">Gestiona tus cuentas</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
              </InternalLink>
              
              <InternalLink 
                href="starbank/facturas" 
                className="group relative overflow-hidden flex flex-1 items-center justify-center p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Send className="text-blue-700 h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold block">Pagar Facturas</span>
                    <span className="text-blue-600 text-sm">Gestiona tus pagos</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
              </InternalLink>
            </div>
          </BankSectionContent>
        </BankSection>
  
        {/* Recent Transactions */}
        <BankSection className="h-96 overflow-auto md:col-span-3">
          <BankSectionHeader>Transacciones Recientes</BankSectionHeader>
          <BankSectionContent>
            <Transactions
              trans={transactions}
              activeAccount={activeAccount}
              fecth={false}
            />
          </BankSectionContent>
          <BankSectionFooter>
            <InternalLink
              href="starbank/transacciones"
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center py-2 rounded-lg transition-colors"
            >
              Ver todas las transacciones <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
            </InternalLink>
          </BankSectionFooter>
        </BankSection>
      </section>
    </div>
  );
}

function TransfersShort({
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
                    : "text-highlight-700"
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

function TablaTransacciones({
  transactions,
  activeAccount,
}: {
  transactions: any;
  activeAccount: any;
}) {
  return (
    <div className="relative overflow-x-auto shadow-sm rounded-lg">
      <table className="min-w-full divide-y divide-surface-200">
        <thead className="sticky top-0 z-10 bg-blue-50">
          <tr>
            <th colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Información</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-surface-200">
          {transactions.map((transaction: StarBankTransaction) => {
            const isPayer = esPagador(transaction, activeAccount);
            return (
              <tr key={transaction.date} className="hover:bg-blue-50 transition-colors">
                <td className="py-4 pl-6 whitespace-nowrap">
                  <AccountImage type={transaction.displayAccountType} name={transaction.displayName}/>
                </td>
                <td className="pr-6 py-4">
                  <div className="text-sm font-medium text-blue-900">{transaction.reason}</div>
                  <div className="text-xs text-blue-500">{transaction.displayName}</div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                  isPayer ? "text-red-600" : "text-emerald-600"
                }`}>
                  <div className="flex items-center">
                    {isPayer ? "- " : "+ "}
                    {formatMoney(transaction.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                  {strToDate(transaction.date)}
                </td>
              </tr>
            );
          })}
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
                  : "text-highlight-700"
              }`}
            >
              <div className="font-bold text-xl text-shadow-border05">
                {formatMoney(amount)}
              </div>
              <div className="text-md">{formatMoney(currentBalance)}</div>
            </div>
          </div>
        );*/

function Transactions({
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
  const [transactions, setTransactions] = useState<StarBankTransaction[]>([]);
  const { transactions: fetchedTransactions, isLoading, error } = useGetTransactions(activeAccount, 100);


  useEffect(() => {
    if (!fetch) {
      setTransactions(trans);
    } else if (fetchedTransactions) {
      setTransactions(fetchedTransactions);
    }
  }, [fetch, trans, fetchedTransactions]);

  if (isLoading) {
    return (
      <div className="h-full p-2 overflow-auto">
        <div className="text-center 2xl:text-2xl font-bold">
          Cargando transacciones...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-2 overflow-auto">
        <div className="text-center 2xl:text-2xl font-bold text-red-600">
          Error al cargar las transacciones
        </div>
      </div>
    );
  }

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
