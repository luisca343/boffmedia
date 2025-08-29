export function filterTransactions(
    row: any,
    columnId: string,
    filterValue: string
  ) {
    const searchTerms = filterValue.split(" ");
    const amount = row.getValue("amount");
    const text = row.getValue("reason");
    let filterIn = true;
  
    for (const term of searchTerms) {
      if ((columnId == "date" || columnId == "amount") && operators.some((operator) => term.includes(operator))) {
        const operator = operators.find((operator) =>
          term.includes(operator)
        ) as string;
        const value = term.split(operator)[1];
        if (isNaN(Number(value)) && columnId === "date") {
          const filter = dateFilter(operator, term, row.getValue(columnId));
          if (!filter) {
            filterIn = false;
          }
        } else {
          const filter = signFilter(operator, amount, Number(value));
          if (!filter) {
            filterIn = false;
          }
        }
      } else if(filterIn) {
        if (!String(text).toLowerCase().includes(term.toLowerCase())) {
          filterIn = false;
        }
      }
    }
    
    return filterIn;
  }

const operators = [">=", "<=", ">", "<", "="];

function signFilter(operator: string, amount: number, filterAmount: number) {
  switch (operator) {
    case ">":
      return amount > filterAmount;
    case "<":
      return amount < filterAmount;
    case ">=":
      return amount >= filterAmount;
    case "<=":
      return amount <= filterAmount;
    case "=":
      return amount === filterAmount;
    default:
      return false;
  }
}

function dateFilter(operator: string, term: string, value: string): boolean {
  const dateStr = term.split(operator)[1];
  const dateArr = dateStr.split("/");
  if(dateArr.length !== 3) return true;
  const filterDate = new Date(`${dateArr[2]}-${dateArr[1]}-${dateArr[0]}`);


  const date = new Date(value);
  switch (operator) {
    case ">":
      return date > filterDate;
    case ">=":
      return date >= filterDate;
    case "<":
      return date < filterDate;
    case "<=":
      return date <= filterDate;
    case "==":
      return date.getTime() === filterDate.getTime();
    case "!=":
      return date.getTime() !== filterDate.getTime();
    default:
      return false;
  }
}


export function filterReason(row: any, columnId: string, filterValue: string) {
    const searchTerms = filterValue.split(" ");
    const text = row.getValue("reason");
    let filterIn = true;

    for (const term of searchTerms) {
      if (filterIn) {
        if (!String(text).toLowerCase().includes(term.toLowerCase())) {
          filterIn = false;
        }
      }
    }

    return filterIn;
  }

  export function filterAmount(row: any, columnId: string, filterValue: string) {
    const searchTerms = filterValue.split(" ");
    const amount = row.getValue(columnId);
    let filterIn = true;
    for (const term of searchTerms) {
      if (
        operators.some((operator) => term.includes(operator))
      ) {
        const operator = operators.find((operator) =>
          term.includes(operator)
        ) as string;
        const value = term.split(operator)[1];
        const filter = signFilter(operator, amount, Number(value));
        if (!filter) {
          filterIn = false;
        }
      } else if(parseInt(term)) {
        const filter = signFilter("=", amount, Number(term));
        if (!filter) {
          filterIn = false;
        }
      }
    }

    return filterIn;
  }
  

  export function filterDate(row: any, columnId: string, filterValue: string) {
    const searchTerms = filterValue.split(" ");
    const date = row.getValue("date");
    let filterIn = true;

    for (const term of searchTerms) {
      if (
        operators.some((operator) => term.includes(operator))
      ) {
        const operator = operators.find((operator) =>
          term.includes(operator)
        ) as string;
        const value = term.split(operator)[1];
        const filter = dateFilter(operator, term, date);
        if (!filter) {
          filterIn = false;
        }
      } else {
        const filter = dateFilter("=", term, date);
        if (!filter) {
          filterIn = false;
        }
      }
    }

    return filterIn;
  }