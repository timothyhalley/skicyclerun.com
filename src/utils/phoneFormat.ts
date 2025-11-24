/**
 * Phone number formatting utilities
 * Formats phone numbers to E.164 format required by Cognito
 * E.164: +[country code][number] (no spaces, dashes, or parentheses)
 */

/**
 * Format phone number to E.164 format
 * Examples:
 *   "5551234567" → "+15551234567" (assumes US)
 *   "+1 555 123 4567" → "+15551234567"
 *   "(555) 123-4567" → "+15551234567"
 *   "+44 20 1234 5678" → "+442012345678"
 */
export function formatPhoneToE164(
  phone: string,
  defaultCountryCode: string = "1",
): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.trim();
  const hasPlus = cleaned.startsWith("+");
  cleaned = cleaned.replace(/\D/g, "");

  if (!cleaned) return null;

  // If no digits, return null
  if (cleaned.length === 0) return null;

  // If it starts with +, keep it
  if (hasPlus) {
    return `+${cleaned}`;
  }

  // US/Canada: 10 digits without country code
  if (cleaned.length === 10) {
    return `+${defaultCountryCode}${cleaned}`;
  }

  // Already has country code (11+ digits)
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }

  // Too short to be valid
  if (cleaned.length < 10) {
    return null;
  }

  return `+${cleaned}`;
}

/**
 * Validate E.164 phone number format
 */
export function isValidE164(phone: string): boolean {
  if (!phone) return false;

  // E.164: +[1-15 digits]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Format phone number for display
 * "+15551234567" → "+1 555 123 4567"
 * "+442012345678" → "+44 20 1234 5678"
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  // US/Canada format
  if (phone.startsWith("+1") && cleaned.length === 11) {
    return `+1 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Generic international format
  return phone;
}

/**
 * Get country code from E.164 phone number
 * "+15551234567" → "1"
 * "+442012345678" → "44"
 */
export function getCountryCode(phone: string): string | null {
  if (!phone || !phone.startsWith("+")) return null;

  const digits = phone.slice(1);

  // US/Canada
  if (digits.startsWith("1")) return "1";

  // UK
  if (digits.startsWith("44")) return "44";

  // Extract first 1-3 digits as country code
  const match = digits.match(/^(\d{1,3})/);
  return match ? match[1] : null;
}
