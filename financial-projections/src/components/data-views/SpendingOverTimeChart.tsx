'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  debit: number;
  credit: number;
  count: number;
}

interface SpendingOverTimeChartProps {
  data: MonthlyData[];
  currency?: string;
}

export function SpendingOverTimeChart({ data, currency = 'GBP' }: SpendingOverTimeChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{formatMonth(label)}</p>
          <p className="text-sm text-red-600">
            Expenses: <span className="font-medium">{formatCurrency(payload[0].value)}</span>
          </p>
          <p className="text-sm text-green-600">
            Income: <span className="font-medium">{formatCurrency(payload[1].value)}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Net: <span className="font-medium">{formatCurrency(payload[1].value - payload[0].value)}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {payload[0].payload.count} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        No transaction data available
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="spending-over-time-chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (value === 'debit' ? 'Expenses' : 'Income')}
          />
          <Bar dataKey="debit" fill="#EF4444" name="debit" radius={[4, 4, 0, 0]} />
          <Bar dataKey="credit" fill="#10B981" name="credit" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
