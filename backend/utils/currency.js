import axios from 'axios';
import pool from '../config/database.js';

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || null;
if (!API_KEY) {
  console.warn('⚠️  EXCHANGE_RATE_API_KEY not set — currency conversion will use fallback rates');
}
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Get exchange rate with caching
// Static fallback rates (USD base) — API key bo'lmasa ishlatiladi
const FALLBACK_RATES = {
  'USD_UZS': 12700, 'USD_RUB': 90, 'USD_EUR': 0.92,
  'USD_AED': 3.67,  'USD_JPY': 149, 'USD_CNY': 7.24,
  'UZS_USD': 1/12700, 'RUB_USD': 1/90, 'EUR_USD': 1/0.92,
  'AED_USD': 1/3.67,  'JPY_USD': 1/149, 'CNY_USD': 1/7.24,
};

export async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // No API key — use fallback rates
    if (!API_KEY) {
      const key = `${fromCurrency}_${toCurrency}`;
      return FALLBACK_RATES[key] || 1;
    }

    // Check cache first (valid for 24 hours)
    const cachedRate = await getCachedRate(fromCurrency, toCurrency);
    if (cachedRate) {
      return parseFloat(cachedRate.rate);
    }

    // Fetch from API
    const response = await axios.get(
      `${BASE_URL}/${API_KEY}/pair/${fromCurrency}/${toCurrency}`
    );

    if (response.data.result === 'success') {
      const rate = response.data.conversion_rate;
      
      // Cache it
      await cacheRate(fromCurrency, toCurrency, rate);
      
      return rate;
    } else {
      throw new Error('Failed to fetch exchange rate');
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error.message);
    
    // If API fails, try to use stale cache
    const staleCache = await getCachedRate(fromCurrency, toCurrency, false);
    if (staleCache) {
      console.log('Using stale cache due to API failure');
      return parseFloat(staleCache.rate);
    }
    
    throw error;
  }
}

// Get all rates for a base currency
export async function getAllRates(baseCurrency) {
  if (!API_KEY) {
    // Return static fallback rates
    return { USD: 1, UZS: 12700, RUB: 90, EUR: 0.92, AED: 3.67, JPY: 149, CNY: 7.24 };
  }
  try {
    const response = await axios.get(
      `${BASE_URL}/${API_KEY}/latest/${baseCurrency}`
    );

    if (response.data.result === 'success') {
      return response.data.conversion_rates;
    } else {
      throw new Error('Failed to fetch rates');
    }
  } catch (error) {
    console.error('Error fetching all rates:', error.message);
    throw error;
  }
}

// Convert amount from one currency to another
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  // Handle same currency conversion
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Get exchange rate and convert
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

// Format currency with proper symbol
export function formatCurrency(amount, currency) {
  const symbols = {
    UZS: "so'm",
    USD: '$',
    RUB: '₽',
    JPY: '¥',
    CNY: '¥',
    EUR: '€',
    AED: 'د.إ',
  };

  const symbol = symbols[currency] || currency + ' ';

  const noDecimalCurrencies = ['UZS', 'JPY'];

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: noDecimalCurrencies.includes(currency) ? 0 : 2,
    maximumFractionDigits: noDecimalCurrencies.includes(currency) ? 0 : 2
  }).format(amount);

  const symbolAfterCurrencies = ['UZS', 'JPY', 'RUB'];

  if (symbolAfterCurrencies.includes(currency)) {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

// Get cached rate from database
async function getCachedRate(fromCurrency, toCurrency, checkExpiry = true) {
  try {
    let query = `
      SELECT rate, updated_at 
      FROM exchange_rates 
      WHERE from_currency = $1 AND to_currency = $2
    `;

    if (checkExpiry) {
      query += ` AND updated_at > NOW() - INTERVAL '24 hours'`;
    }

    const result = await pool.query(query, [fromCurrency, toCurrency]);

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting cached rate:', error);
    return null;
  }
}

// Cache rate in database
async function cacheRate(fromCurrency, toCurrency, rate) {
  try {
    await pool.query(
      `INSERT INTO exchange_rates (from_currency, to_currency, rate, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (from_currency, to_currency)
       DO UPDATE SET rate = $3, updated_at = NOW()`,
      [fromCurrency, toCurrency, rate]
    );
  } catch (error) {
    console.error('Error caching rate:', error);
  }
}

// Supported currencies list
export const POPULAR_CURRENCIES = [
  { code: 'UZS', name: "O'zbek so'mi", symbol: "so'm", flag: '🇺🇿' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
];

