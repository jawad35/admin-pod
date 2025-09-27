import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const serverRequestsData = [
  { day: 'Mon', requests: 12000 },
  { day: 'Tue', requests: 19000 },
  { day: 'Wed', requests: 15000 },
  { day: 'Thu', requests: 25000 },
  { day: 'Fri', requests: 22000 },
  { day: 'Sat', requests: 18000 },
  { day: 'Sun', requests: 14000 },
];

const ramUsageData = [
  { time: '00:00', usage: 45 },
  { time: '04:00', usage: 52 },
  { time: '08:00', usage: 68 },
  { time: '12:00', usage: 72 },
  { time: '16:00', usage: 65 },
  { time: '20:00', usage: 58 },
  { time: '24:00', usage: 48 },
];

export function ServerRequestsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serverRequestsData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="day" 
            className="text-muted-foreground text-xs"
          />
          <YAxis 
            className="text-muted-foreground text-xs"
            tickFormatter={(value) => `${(value / 1000)}K`}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()}`, 'Requests']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="requests" 
            stroke="hsl(var(--chart-2))" 
            fill="hsl(var(--chart-2))"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RAMUsageChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ramUsageData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="time" 
            className="text-muted-foreground text-xs"
          />
          <YAxis 
            className="text-muted-foreground text-xs"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'RAM Usage']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="usage" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
