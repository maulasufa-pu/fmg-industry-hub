import { NextResponse } from "next/server";
import { FALLBACK_EXCHANGE_RATES } from "@/lib/currency";

const EXCHANGE_REQUEST_TIMEOUT_MS = 5000;

function exchangeRequest(url: string) {
  return fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'FMG-Industry-Hub/1.0'
    },
    signal: AbortSignal.timeout(EXCHANGE_REQUEST_TIMEOUT_MS),
  });
}

function roundExchangeRate(rate: number, currency: string): number {
  switch (currency) {
    case 'USD':
      return 1; 
    case 'EUR':
    case 'GBP':
    case 'AUD':
    case 'CAD':
      return Math.round(rate * 10000) / 10000; 
    case 'JPY':
    case 'KRW':
      return Math.round(rate); 
    case 'IDR':
    case 'VND':
      return Math.round(rate); 
    case 'INR':
    case 'PHP':
    case 'THB':
      return Math.round(rate * 100) / 100; 
    default:
      return Math.round(rate * 100) / 100; 
  }
}

export async function GET() {
  try {
    let response = await exchangeRequest("https://api.exchangerate-api.com/v4/latest/USD");

    if (!response.ok) {
      //console.log(`Primary API failed with status: ${response.status}`);
      response = await exchangeRequest("https://api.jsonrates.com/rates/");
    }

    if (!response.ok) {
      //console.log(`Fallback API also failed with status: ${response.status}`);
      response = await exchangeRequest("https://api.vatcomply.com/rates?base=USD");
    }

    if (!response.ok) {
      //console.log(`All APIs failed, using fallback rates`);
      throw new Error("All exchange rate APIs failed");
    }

    const data = await response.json();
    
    //console.log("Exchange API response:", {
    //   success: response.ok,
    //   status: response.status,
    //   url: response.url,
    //   hasRates: !!data.rates,
    //   hasConversionRates: !!data.conversion_rates,
    //   hasSuccess: data.success,
    //   dataKeys: Object.keys(data || {}),
    // });
    
    if (data.success === false || data.error) {
      //console.log("API returned error:", data.error || "Unknown error");
      throw new Error(`API Error: ${data.error?.info || data.error?.message || "Invalid response"}`);
    }
    
    if (!data.rates && !data.conversion_rates) {
      //console.error("No rates found in API response:", { dataKeys: Object.keys(data) });
      throw new Error("Invalid API response format - no rates found");
    }

    const rawRates = data.rates || data.conversion_rates || data;
    
    const roundedRates: Record<string, number> = {
      USD: 1,
    };

    Object.entries(rawRates).forEach(([currency, rate]) => {
      if (typeof rate === 'number') {
        roundedRates[currency] = roundExchangeRate(rate, currency);
      }
    });

    const essentialRates = { ...FALLBACK_EXCHANGE_RATES, ...roundedRates };

    return NextResponse.json({
      success: true,
      base: "USD",
      date: new Date().toISOString().split('T')[0],
      rates: essentialRates,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    //console.error("Exchange rate API error:", error);
    
    return NextResponse.json({
      success: false,
      base: "USD",
      date: new Date().toISOString().split('T')[0],
      rates: FALLBACK_EXCHANGE_RATES,
      lastUpdated: new Date().toISOString(),
      error: "Using fallback rates due to API unavailability",
    });
  }
}
