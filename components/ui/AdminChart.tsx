import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface ChartProps {
  data: { month: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800 dark:text-gray-100">{label}</p>
        <p className="text-sm text-primary dark:text-indigo-400">{`Reservas: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export const AdminChart: React.FC<ChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  const formattedData = data.map(item => ({
      ...item,
      // Format 'YYYY-MM' to 'MMM' (e.g., '2023-01' to 'Jan')
      month: new Date(item.month + '-02').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  }));


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-80 w-full mt-6">
       <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Reservas nos Últimos 12 Meses</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" stroke={tickColor} tick={{ fontSize: 12 }} />
          <YAxis stroke={tickColor} allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(129, 140, 248, 0.1)' }}/>
          <Bar dataKey="count" name="Reservas" fill="#818CF8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
