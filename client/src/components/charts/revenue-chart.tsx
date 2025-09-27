import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const data = [
  { month: 'Jan', revenue: 850000 },
  { month: 'Feb', revenue: 920000 },
  { month: 'Mar', revenue: 1100000 },
  { month: 'Apr', revenue: 1050000 },
  { month: 'May', revenue: 1200000 },
  { month: 'Jun', revenue: 1245000 },
];

export default function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-muted-foreground text-xs"
          />
          <YAxis 
            className="text-muted-foreground text-xs"
            tickFormatter={(value) => `₨${(value / 1000)}K`}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
