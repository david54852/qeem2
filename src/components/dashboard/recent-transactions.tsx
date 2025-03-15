import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  id: string;
  type: "increase" | "decrease";
  name: string;
  category: string;
  date: string;
  amount: number;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export default function RecentTransactions({
  transactions = [],
}: RecentTransactionsProps) {
  // Sample data if no transactions are provided
  const sampleTransactions: Transaction[] = [
    {
      id: "1",
      type: "increase",
      name: "Stock Market Gain",
      category: "Investments",
      date: "Today",
      amount: 1250,
    },
    {
      id: "2",
      type: "decrease",
      name: "Credit Card Payment",
      category: "Debt",
      date: "Yesterday",
      amount: 500,
    },
    {
      id: "3",
      type: "increase",
      name: "Rental Income",
      category: "Real Estate",
      date: "Jul 15, 2023",
      amount: 2000,
    },
    {
      id: "4",
      type: "decrease",
      name: "Property Tax",
      category: "Real Estate",
      date: "Jul 10, 2023",
      amount: 1800,
    },
  ];

  const displayTransactions =
    transactions.length > 0 ? transactions : sampleTransactions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${transaction.type === "increase" ? "bg-green-100" : "bg-red-100"}`}
                >
                  {transaction.type === "increase" ? (
                    <ArrowUpRight
                      className={`h-4 w-4 ${transaction.type === "increase" ? "text-green-600" : "text-red-600"}`}
                    />
                  ) : (
                    <ArrowDownRight
                      className={`h-4 w-4 ${transaction.type === "increase" ? "text-green-600" : "text-red-600"}`}
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
              </div>
              <div
                className={`font-medium ${transaction.type === "increase" ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.type === "increase" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
