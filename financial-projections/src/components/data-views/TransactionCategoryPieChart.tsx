'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryData {
  id: string;
  name: string;
  color: string | null;
  totalDebit: number;
  totalCredit: number;
  count: number;
}

interface TransactionCategoryPieChartProps {
  data: CategoryData[];
  currency?: string;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
];

export function TransactionCategoryPieChart({ data, currency = 'GBP' }: TransactionCategoryPieChartProps) {
  // Prepare data for pie chart (only expenses/debits)
  const chartData = data
    .filter(item => item.totalDebit > 0)
    .map(item => ({
      name: item.name,
      value: item.totalDebit,
      color: item.color || COLORS[data.indexOf(item) % COLORS.length],
      count: item.count,
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Transactions: <span className="font-medium">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage:{' '}
            <span className="font-medium">
              {((data.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        No categorized transaction data available
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="transaction-category-pie-chart">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
