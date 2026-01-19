'use client';

interface CategoryData {
  id: string;
  name: string;
  color: string | null;
  totalDebit: number;
  totalCredit: number;
  count: number;
}

interface CategoryBreakdownTableProps {
  data: CategoryData[];
  currency?: string;
}

export function CategoryBreakdownTable({ data, currency = 'GBP' }: CategoryBreakdownTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const totalDebit = data.reduce((sum, cat) => sum + cat.totalDebit, 0);

  return (
    <div className="overflow-x-auto" data-testid="category-breakdown-table">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expenses
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Income
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transactions
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % of Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((category) => {
            const percentage = totalDebit > 0 ? (category.totalDebit / totalDebit) * 100 : 0;
            return (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div
                        className="w-4 h-4 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                  {formatCurrency(category.totalDebit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                  {formatCurrency(category.totalCredit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                  {category.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                  {percentage.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 font-semibold">
          <tr>
            <td className="px-6 py-4 text-sm text-gray-900">Total</td>
            <td className="px-6 py-4 text-right text-sm text-red-600">
              {formatCurrency(data.reduce((sum, cat) => sum + cat.totalDebit, 0))}
            </td>
            <td className="px-6 py-4 text-right text-sm text-green-600">
              {formatCurrency(data.reduce((sum, cat) => sum + cat.totalCredit, 0))}
            </td>
            <td className="px-6 py-4 text-right text-sm text-gray-700">
              {data.reduce((sum, cat) => sum + cat.count, 0)}
            </td>
            <td className="px-6 py-4 text-right text-sm text-gray-700">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
