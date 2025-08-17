import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp } from "lucide-react";
import { format, isValid } from "date-fns";

interface EquityChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  startingBalance: number;
}

export function EquityChart({ data, startingBalance }: EquityChartProps) {
  // Format data for the chart with proper cumulative values
  const chartData = data.map((point, index) => {
    // For the first point, we show the starting balance
    if (index === 0) {
      return {
        trade: 0,
        date: 'Start',
        balance: startingBalance,
        displayDate: 'Start'
      };
    }
    
    // For subsequent points, we show the cumulative balance
    // Safely format the date
    let displayDate = 'Invalid Date';
    const dateObj = new Date(point.date);
    if (isValid(dateObj)) {
      displayDate = format(dateObj, 'MMM dd');
    }
    
    return {
      trade: index,
      date: point.date,
      balance: startingBalance + point.value,
      displayDate: displayDate
    };
  });

  // Calculate min and max values for Y-axis scaling
  const values = chartData.map(d => d.balance);
  const minValue = values.length > 0 ? Math.min(...values) : startingBalance;
  const maxValue = values.length > 0 ? Math.max(...values) : startingBalance;
  const yAxisPadding = Math.max(Math.abs(minValue - startingBalance), Math.abs(maxValue - startingBalance)) * 0.1 || 100;

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <TrendingUp className="h-5 w-5" />
          Account Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="displayDate" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                domain={[minValue - yAxisPadding, maxValue + yAxisPadding]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--card-foreground))'
                }}
                formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Equity']}
                labelFormatter={(label, data) => {
                  const payload = data[0]?.payload;
                  if (!payload) return 'Date: Unknown';
                  
                  if (payload.date === 'Start') {
                    return 'Date: Start';
                  }
                  
                  const dateObj = new Date(payload.date);
                  if (isValid(dateObj)) {
                    return `Date: ${format(dateObj, 'MMM dd, yyyy')}`;
                  }
                  return `Date: Invalid Date`;
                }}
              />
              <ReferenceLine y={startingBalance} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ 
                  stroke: 'hsl(var(--primary))', 
                  strokeWidth: 2, 
                  r: 4,
                  fill: 'hsl(var(--card))'
                }}
                activeDot={{ 
                  r: 6, 
                  fill: 'hsl(var(--card))',
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}