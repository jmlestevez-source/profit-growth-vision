
// Función para formatear grandes cantidades de dinero (millones, billones)
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "$0";
  
  const absAmount = Math.abs(amount);
  if (absAmount >= 1e12) {
    return `$${(amount / 1e12).toFixed(2)}T`;
  } else if (absAmount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}B`;
  } else if (absAmount >= 1e6) {
    return `$${(amount / 1e6).toFixed(2)}M`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
};

// Función para formatear porcentajes
export const formatPercentage = (percentage: number): string => {
  const formattedValue = percentage.toFixed(2);
  return percentage >= 0 ? `+${formattedValue}%` : `${formattedValue}%`;
};
