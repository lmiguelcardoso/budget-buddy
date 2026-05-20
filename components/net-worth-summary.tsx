interface NetWorthSummaryProps {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
}

export function NetWorthSummary({
  totalAssets,
  totalLiabilities,
  netWorth,
}: NetWorthSummaryProps) {
  const isPositive = !netWorth.startsWith("-");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Assets</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {formatCurrency(totalAssets)}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Liabilities</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {formatCurrency(totalLiabilities)}
        </p>
      </div>
      <div
        className={`rounded-xl border p-6 shadow-sm ${
          isPositive
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          Net Worth
        </p>
        <p
          className={`mt-1 text-2xl font-bold ${
            isPositive ? "text-green-700" : "text-red-700"
          }`}
        >
          {formatCurrency(netWorth)}
        </p>
      </div>
    </div>
  );
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}
