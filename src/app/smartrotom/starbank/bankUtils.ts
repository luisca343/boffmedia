import { Account } from "@/services/api/smartrotom/usersService";

export function getValidAccountId(accounts: Account[]): number {
    const storedAccount = localStorage.getItem("activeAccount");
    if (storedAccount) {
        const accountId = parseInt(storedAccount);
        if (accounts.find((account) => account.id === accountId)) {
            return parseInt(storedAccount);
        }
    }
    return accounts[0].id;
}


export function getActiveAccountBalance(accounts: { id: number, balance: number }[], activeAccount: number): number {
    const account = accounts.find((account) => account.id === activeAccount);
    return account ? account.balance : 0;
}

export function changeActiveAccount(activeAccount: number): number {
    localStorage.setItem("activeAccount", activeAccount.toString());
    return activeAccount;
}

export function formatMoney(amount: number): string {
    return `${Number(amount).toLocaleString('de-DE')} ¥`;
}