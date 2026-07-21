// src/lib/phoneNormalizer.ts
// Phone number normalization and validation utility
// Version: 1.0 (Production-Ready)
// Purpose: Convert phone numbers to E.164 format with validation

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Phone normalization result type
 */
export interface PhoneNormalizationResult {
  valid: boolean;
  e164?: string; // E.164 format: +919876543210
  originalInput: string;
  country?: string;
  error?: string;
}

/**
 * Batch normalization result
 */
export interface BatchNormalizationResult {
  totalRows: number;
  validNumbers: number;
  invalidNumbers: number;
  results: PhoneNormalizationResult[];
  summary: {
    successRate: number;
    invalidRows: Array<{
      rowNumber: number;
      input: string;
      error: string;
    }>;
  };
}

/**
 * Phone number normalizer class
 * Converts various phone formats to E.164 standard
 *
 * E.164 format: +[country code][phone number]
 * Example: +919876543210
 */
export class PhoneNormalizer {
  private defaultCountry: string = 'IN'; // India
  private allowedCountries: Set<string> = new Set(['IN', 'US', 'GB', 'AU', 'CA']);

  constructor(defaultCountry: string = 'IN') {
    this.defaultCountry = defaultCountry;
  }

  /**
   * Normalize a single phone number to E.164 format
   *
   * Handles various input formats:
   * - "9876543210" → "+919876543210"
   * - "919876543210" → "+919876543210"
   * - "+919876543210" → "+919876543210"
   * - "+91 9876543210" → "+919876543210"
   * - "09876543210" → "+919876543210" (removes leading 0)
   *
   * @param phoneInput Raw phone number input
   * @param countryCode Optional country code override
   * @returns PhoneNormalizationResult with E.164 format or error
   */
  normalizeSingle(
    phoneInput: string,
    countryCode?: string
  ): PhoneNormalizationResult {
    const originalInput = phoneInput;

    try {
      // Step 1: Sanitize input
      if (!phoneInput || typeof phoneInput !== 'string') {
        return {
          valid: false,
          originalInput,
          error: 'Phone number must be a non-empty string',
        };
      }

      // Remove all whitespace
      let sanitized = phoneInput.trim();

      // Remove common separators: spaces, dashes, parentheses
      sanitized = sanitized
        .replace(/[\s\-()]/g, '')
        .replace(/[^\d+]/g, '');

      if (!sanitized) {
        return {
          valid: false,
          originalInput,
          error: 'Phone number contains no valid digits',
        };
      }

      // Step 2: Determine country code
      const country = countryCode || this.defaultCountry;

      // Step 3: Parse phone number using libphonenumber-js
      const parsedNumber = parsePhoneNumber(sanitized, country as any);

      if (!parsedNumber) {
        return {
          valid: false,
          originalInput,
          country,
          error: `Could not parse as valid ${country} phone number`,
        };
      }

      // Step 4: Validate format
      if (!isValidPhoneNumber(sanitized, country as any)) {
        return {
          valid: false,
          originalInput,
          country,
          error: `Invalid phone number format for ${country}`,
        };
      }

      // Step 5: Get E.164 format
      const e164 = parsedNumber.format('E.164');

      return {
        valid: true,
        e164,
        originalInput,
        country: parsedNumber.country,
      };
    } catch (err) {
      return {
        valid: false,
        originalInput,
        error: `Normalization error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Normalize batch of phone numbers (e.g., from Excel upload)
   *
   * @param phoneNumbers Array of phone strings
   * @param countryCode Optional country code for all numbers
   * @returns BatchNormalizationResult with all results and summary
   */
  normalizeBatch(
    phoneNumbers: string[],
    countryCode?: string
  ): BatchNormalizationResult {
    const results = phoneNumbers.map((phone, index) =>
      this.normalizeSingle(phone, countryCode)
    );

    const validResults = results.filter((r) => r.valid);
    const invalidResults = results.filter((r) => !r.valid);

    // Guard against empty array (division by zero → NaN)
    const successRate = results.length === 0 ? 0 : validResults.length / results.length;

    // Track original row index explicitly (avoids O(n²) indexOf)
    const invalidRows = results
      .map((r, index) => ({ r, rowNumber: index + 1 }))
      .filter(({ r }) => !r.valid)
      .map(({ r, rowNumber }) => ({
        rowNumber,
        input: r.originalInput,
        error: r.error || 'Unknown error',
      }));

    const summary = {
      successRate,
      invalidRows,
    };

    return {
      totalRows: phoneNumbers.length,
      validNumbers: validResults.length,
      invalidNumbers: invalidResults.length,
      results,
      summary,
    };
  }

  /**
   * Check if a phone number is already in E.164 format
   *
   * @param phoneNumber Phone number to check
   * @returns true if already E.164 format
   */
  isE164Format(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Detect country code from phone number
   *
   * @param phoneNumber Phone number (any format)
   * @returns Country code or null if not detected
   */
  detectCountry(phoneNumber: string): string | null {
    try {
      const parsed = parsePhoneNumber(phoneNumber);
      return parsed?.country || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate phone number without normalizing
   *
   * @param phoneNumber Phone number to validate
   * @param countryCode Optional country code
   * @returns true if valid
   */
  isValid(phoneNumber: string, countryCode?: string): boolean {
    const country = countryCode || this.defaultCountry;
    return isValidPhoneNumber(phoneNumber, country as any);
  }

  /**
   * Extract digits only from phone number
   *
   * @param phoneNumber Phone number (any format)
   * @returns Digits only (no + or other characters)
   */
  extractDigits(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }

  /**
   * Format phone number for display (not E.164)
   *
   * Formats like: +91 98765 43210 (national format)
   *
   * @param phoneNumber Phone in any format
   * @param countryCode Optional country code
   * @returns Formatted display string or null if invalid
   */
  formatForDisplay(phoneNumber: string, countryCode?: string): string | null {
    try {
      const country = countryCode || this.defaultCountry;
      const parsed = parsePhoneNumber(phoneNumber, country as any);
      return parsed?.formatInternational() || null;
    } catch {
      return null;
    }
  }
}

/**
 * Singleton instance for easy import
 */
export const phoneNormalizer = new PhoneNormalizer('IN');

/**
 * Utility function for quick normalization
 * @param phone Phone number
 * @param country Optional country code
 * @returns E.164 format or null if invalid
 */
export function normalizePhone(phone: string, country?: string): string | null {
  const result = phoneNormalizer.normalizeSingle(phone, country);
  return result.valid ? (result.e164 ?? null) : null;
}

/**
 * Utility function for batch normalization
 * @param phones Array of phone numbers
 * @param country Optional country code
 * @returns BatchNormalizationResult
 */
export function normalizePhones(
  phones: string[],
  country?: string
): BatchNormalizationResult {
  return phoneNormalizer.normalizeBatch(phones, country);
}

/**
 * Utility function for validation only
 * @param phone Phone number
 * @param country Optional country code
 * @returns true if valid
 */
export function isValidPhone(phone: string, country?: string): boolean {
  return phoneNormalizer.isValid(phone, country);
}

/**
 * Example usage:
 *
 * // Single number
 * const result = normalizePhone('9876543210', 'IN');
 * // result: "+919876543210"
 *
 * // Batch from Excel
 * const batchResult = normalizePhones([
 *   '9876543210',
 *   '+91 9876543211',
 *   'invalid number'
 * ], 'IN');
 * // Shows success rate, errors, etc.
 *
 * // Validation
 * if (isValidPhone('9876543210')) {
 *   // Process contact
 * }
 */
