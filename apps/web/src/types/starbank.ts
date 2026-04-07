// StarBankAccount is available in @boffmedia/shared and should be imported from there.
// Transaction has a different shape from shared StarBankTransaction (uses `balance` instead of fromBalance/toBalance).

export interface Transaction {
    isPayer: boolean;
    reason: string;
    amount: number;
    balance: number;
    date: string;
    name?: string;
    type?: string;
  }
