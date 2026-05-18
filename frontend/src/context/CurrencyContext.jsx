import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(true);

  // Load user's preferred currency
  useEffect(() => {
    const loadUserCurrency = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/currency/user/preference');
          setCurrency(response.data.currency || 'USD');
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Error loading user currency:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserCurrency();
  }, []);

  // Load exchange rates (USD base)
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const response = await api.get('/currency/rates/USD');
        setExchangeRates(response.data.rates || {});
      } catch (error) {
        console.error('Error loading exchange rates:', error.message);
      }
    };

    loadExchangeRates();
  }, []);

  // Update user's currency preference
  const updateCurrency = async (newCurrency) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.put('/currency/user/preference', { currency: newCurrency });
      }
      setCurrency(newCurrency);
    } catch (error) {
      console.error('Error updating currency:', error.message);
      throw error;
    }
  };

  // Convert amount to user's currency
  const convertAmount = (amount, fromCurrency = 'USD') => {
    if (!amount || amount === 0) return 0;
    if (fromCurrency === currency) return amount;
    
    // exchangeRates contains rates from the base currency (set by API call)
    // When we call /currency/rates/USD, we get: { VND: 25000, EUR: 0.85, ... }
    // This means: 1 USD = 25000 VND, 1 USD = 0.85 EUR
    
    if (fromCurrency === 'USD') {
      // Direct conversion from USD to target currency
      const rate = exchangeRates[currency] || 1;
      return amount * rate;
    } else if (currency === 'USD') {
      // Reverse conversion from some currency to USD
      const rate = exchangeRates[fromCurrency] || 1;
      return amount / rate;
    } else {
      // Convert from one non-USD currency to another via USD
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[currency] || 1;
      const amountInUSD = amount / fromRate;
      return amountInUSD * toRate;
    }
  };

  // Format currency with proper symbol
  const formatCurrency = (amount, currencyCode = currency) => {
    const symbols = {
      UZS: "so'm",
      USD: '$',
      RUB: '₽',
      JPY: '¥',
      CNY: '¥',
      EUR: '€',
      AED: 'د.إ',
    };

    const symbol = symbols[currencyCode] || currencyCode + ' ';

    // Kasr qo'yilmaydigan valyutalar
    const noDecimalCurrencies = ['UZS', 'JPY'];

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: noDecimalCurrencies.includes(currencyCode) ? 0 : 2,
      maximumFractionDigits: noDecimalCurrencies.includes(currencyCode) ? 0 : 2
    }).format(Math.abs(amount));

    // Belgisi miqdor ortidan keladigan valyutalar
    const symbolAfterCurrencies = ['UZS', 'JPY', 'RUB'];

    if (symbolAfterCurrencies.includes(currencyCode)) {
      return `${formattedAmount} ${symbol}`;
    }

    return `${symbol}${formattedAmount}`;
  };

  // Convert and format amount to user's display currency
  const formatAmount = (amount, fromCurrency = 'USD') => {
    const convertedAmount = convertAmount(amount, fromCurrency);
    return formatCurrency(convertedAmount, currency);
  };

  const value = {
    currency,
    setCurrency: updateCurrency,
    exchangeRates,
    convertAmount,
    formatCurrency,
    formatAmount,
    loading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

