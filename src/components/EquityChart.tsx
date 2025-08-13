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
import { format } from "date-fns";

interface EquityChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  startingBalance: number;
}

export function EquityChart({ data, startingBalance }: EquityChartProps) {
  // Format data for the chart
  const chartData = data.map((point, index) => ({
    ...point,
    date: format(new Date(point.date), 'MMM dd'),
    cumulative: point.value,
    displayValue: point.value >= 0 
      ? `+$${Math.abs(point.value).toFixed(2)}` 
      : `-$${Math.abs(point.value).toFixed(2)}`
  }));

  // Calculate min and max values for Y-axis scaling
  const values = chartData.map(d => d.cumulative);
  const minValue = values.length > 0 ? Math.min(...values, 0) : 0;
  const maxValue = values.length > 0 ? Math.max(...values, 0) : 0;
  const yAxisPadding = Math.max(Math.abs(minValue), Math.abs(maxValue)) * 0.1 || 100;

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
                dataKey="date" 
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
                labelFormatter={(label) => `Date: ${label}`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ 
                  stroke: 'hsl(var(--primary))', 
                  strokeWidth: 2, 
                  r: 3,
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