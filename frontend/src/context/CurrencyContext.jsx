import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  INR: { symbol: '₹', rate: 83.5 },
  CNY: { symbol: '¥', rate: 7.23 },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');

  // Load saved currency on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCurrency');
    if (saved && CURRENCY_RATES[saved]) {
      setCurrency(saved);
    }
  }, []);

  const changeCurrency = (code) => {
    if (CURRENCY_RATES[code]) {
      setCurrency(code);
      localStorage.setItem('selectedCurrency', code);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '';
    const { symbol, rate } = CURRENCY_RATES[currency];
    const converted = amount * rate;
    
    // Formatting numbers with commas
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatCurrency, availableCurrencies: Object.keys(CURRENCY_RATES) }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
