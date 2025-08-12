
// Trading utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatRR = (rr: number | null): string => {
  if (rr === null || rr === undefined) return '-';
  return `${rr > 0 ? '+' : ''}${rr.toFixed(1)}R`;
};

export const calculatePnL = (
  trade: { result: string; rr?: number | null; pnl_dollar?: number | null; risk_percentage?: number | null },
  account: { starting_balance: number; risk_per_trade: number; current_balance: number }
): number => {
  // If trade has pnl_dollar, use that directly
  if ('pnl_dollar' in trade && trade.pnl_dollar !== null && trade.pnl_dollar !== undefined) {
    return Number(trade.pnl_dollar);
  }
  
  // Use trade's risk percentage or account default, calculate from starting balance
  const riskPercentage = trade.risk_percentage || account.risk_per_trade;
  const riskAmount = account.starting_balance * (riskPercentage / 100);
  
  switch (trade.result.toLowerCase()) {
    case 'win':
      return riskAmount * Number(trade.rr || 0);
    case 'loss':
      return -riskAmount;
    default:
      return 0; // breakeven
  }
};

export const getSessionFromTime = (date: Date): string => {
  const hour = date.getHours();
  
  if (hour >= 0 && hour < 8) return 'Asia';
  if (hour >= 8 && hour < 13) return 'London';
  if (hour >= 13 && hour < 16) return 'NY Open';
  return 'NY Close';
};

export const getResultColor = (result: string): string => {
  switch (result.toLowerCase()) {
    case 'win': return 'text-success bg-success/10 border-success/20';
    case 'loss': return 'text-destructive bg-destructive/10 border-destructive/20';
    default: return 'text-muted-foreground bg-muted/10 border-border';
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const generateEquityCurve = (trades: any[]) => {
  if (trades.length === 0) {
    return [{ date: 'Start', value: 0 }];
  }

  // Sort trades by date
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let runningTotal = 0;
  const equityData = [{ date: 'Start', value: 0 }];
  
  sortedTrades.forEach(trade => {
    const pnlDollar = trade.pnl_dollar || 0;
    runningTotal += pnlDollar;
    
    equityData.push({
      date: new Date(trade.date).toLocaleDateString(),
      value: runningTotal
    });
  });
  
  return equityData;
};
