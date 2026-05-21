export interface StarBankAccount {
  id: number;
  balance: number;
  name: string;
  type: string;
}

export interface Transaction {
  isPayer: boolean;
  reason: string;
  amount: number;
  balance: number;
  date: string;
}

export interface FullTransaction {
  from: number;
  to: number;
  amount: number;
  fromBalance: number;
  toBalance: number;
  reason: string;
  type: string;
  date: string;
  isPayer: boolean;
}
