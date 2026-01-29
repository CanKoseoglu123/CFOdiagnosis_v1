/**
 * Stripe Client Configuration
 *
 * Initializes Stripe SDK and provides geo-pricing utilities.
 */

import Stripe from 'stripe';

// Initialize Stripe with the secret key
// Will be undefined if STRIPE_SECRET_KEY not set (feature flag disabled)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

/**
 * EU countries for EUR pricing
 * Users from these countries see EUR prices, others see USD
 */
export const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

/**
 * Get the appropriate Stripe Price ID based on user's country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns EUR price ID for EU countries, USD price ID for others
 */
export function getPriceId(countryCode: string | null): string {
  if (countryCode && EU_COUNTRIES.includes(countryCode.toUpperCase())) {
    return process.env.STRIPE_PRICE_ID_EUR!;
  }
  return process.env.STRIPE_PRICE_ID_USD!;
}

/**
 * Get currency for a country
 */
export function getCurrency(countryCode: string | null): 'eur' | 'usd' {
  if (countryCode && EU_COUNTRIES.includes(countryCode.toUpperCase())) {
    return 'eur';
  }
  return 'usd';
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_ID_USD &&
    process.env.STRIPE_PRICE_ID_EUR
  );
}
