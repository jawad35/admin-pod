import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'Jan', newShops: 8, churnedShops: 3 },
  { month: 'Feb', newShops: 12, churnedShops: 2 },
  { month: 'Mar', newShops: 15, churnedShops: 4 },
  { month: 'Apr', newShops: 9, churnedShops: 1 },
  { month: 'May', newShops: 18, churnedShops: 5 },
  { month: 'Jun', newShops: 12, churnedShops: 2 },
];

export default function ShopGrowthChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-muted-foreground text-xs"
          />
          <YAxis 
            className="text-muted-foreground text-xs"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="newShops" 
            fill="hsl(var(--chart-2))" 
            name="New Shops"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="churnedShops" 
            fill="hsl(var(--destructive))" 
            name="Churned Shops"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
