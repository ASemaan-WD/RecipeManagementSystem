/**
 * Pure utility functions for parsing and scaling recipe ingredient quantities.
 * Handles fractions, decimals, ranges, unitless quantities, and non-scalable terms.
 */

const NON_SCALABLE_TERMS = [
  'pinch',
  'to taste',
  'as needed',
  'dash',
  'splash',
  'handful',
  'some',
] as const;

const FRACTION_MAP: Record<string, number> = {
  '1/8': 0.125,
  '1/6': 1 / 6,
  '1/4': 0.25,
  '1/3': 1 / 3,
  '3/8': 0.375,
  '1/2': 0.5,
  '5/8': 0.625,
  '2/3': 2 / 3,
  '3/4': 0.75,
  '5/6': 5 / 6,
  '7/8': 0.875,
};

const COMMON_FRACTIONS: [number, string][] = [
  [0.125, '1/8'],
  [1 / 6, '1/6'],
  [0.25, '1/4'],
  [1 / 3, '1/3'],
  [0.375, '3/8'],
  [0.5, '1/2'],
  [0.625, '5/8'],
  [2 / 3, '2/3'],
  [0.75, '3/4'],
  [5 / 6, '5/6'],
  [0.875, '7/8'],
];

const FRACTION_TOLERANCE = 0.02;

interface ParsedQuantity {
  value: number;
  unit: string;
  raw: string;
}

/**
 * Check if a quantity string contains a non-scalable term.
 */
function isNonScalable(quantity: string): boolean {
  const lower = quantity.toLowerCase().trim();
  return NON_SCALABLE_TERMS.some((term) => lower.includes(term));
}

/**
 * Parse a fraction string (e.g., "1/2") into a numeric value.
 */
function parseFraction(fraction: string): number | null {
  const known = FRACTION_MAP[fraction];
  if (known !== undefined) return known;

  const parts = fraction.split('/');
  if (parts.length !== 2) return null;

  const numerator = Number(parts[0]!);
  const denominator = Number(parts[1]!);
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;

  return numerator / denominator;
}

/**
 * Parse a quantity string into a numeric value, unit, and raw string.
 *
 * Handles:
 * - Simple numbers: "2 cups" → { value: 2, unit: "cups" }
 * - Fractions: "1/2 cup" → { value: 0.5, unit: "cup" }
 * - Mixed numbers: "1 1/2 cups" → { value: 1.5, unit: "cups" }
 * - Decimals: "2.5 tbsp" → { value: 2.5, unit: "tbsp" }
 * - Ranges: "2-3 cups" → { value: 2, unit: "cups" } (uses lower bound)
 * - Unitless: "3" → { value: 3, unit: "" }
 *
 * Returns null if the string cannot be parsed as a numeric quantity.
 */
export function parseQuantity(quantity: string): ParsedQuantity | null {
  const trimmed = quantity.trim();
  if (!trimmed) return null;
  if (isNonScalable(trimmed)) return null;

  // Range pattern: "2-3 cups" — use the lower bound
  const rangeMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(.*)$/
  );
  if (rangeMatch) {
    const low = Number(rangeMatch[1]!);
    const high = Number(rangeMatch[2]!);
    const unit = rangeMatch[3]!.trim();
    if (!isNaN(low) && !isNaN(high)) {
      return { value: low, unit, raw: trimmed };
    }
  }

  // Mixed number pattern: "1 1/2 cups"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+\/\d+)\s*(.*)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]!);
    const frac = parseFraction(mixedMatch[2]!);
    const unit = mixedMatch[3]!.trim();
    if (!isNaN(whole) && frac !== null) {
      return { value: whole + frac, unit, raw: trimmed };
    }
  }

  // Fraction pattern: "1/2 cup"
  const fractionMatch = trimmed.match(/^(\d+\/\d+)\s*(.*)$/);
  if (fractionMatch) {
    const frac = parseFraction(fractionMatch[1]!);
    const unit = fractionMatch[2]!.trim();
    if (frac !== null) {
      return { value: frac, unit, raw: trimmed };
    }
  }

  // Decimal or integer pattern: "2.5 tbsp" or "3 eggs" or "2"
  const numberMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (numberMatch) {
    const value = Number(numberMatch[1]!);
    const unit = numberMatch[2]!.trim();
    if (!isNaN(value)) {
      return { value, unit, raw: trimmed };
    }
  }

  return null;
}

/**
 * Format a numeric value into a user-friendly string.
 * Converts common decimal values back to fractions (e.g., 0.5 → "1/2").
 * Rounds to 2 decimal places for non-fraction values.
 */
export function formatQuantity(value: number): string {
  if (value <= 0) return '0';

  const whole = Math.floor(value);
  const fractional = value - whole;

  // Check if the fractional part matches a common fraction
  if (fractional > FRACTION_TOLERANCE) {
    for (const [decimal, display] of COMMON_FRACTIONS) {
      if (Math.abs(fractional - decimal) < FRACTION_TOLERANCE) {
        return whole > 0 ? `${whole} ${display}` : display;
      }
    }
  }

  // No matching fraction — format as a number
  if (fractional < FRACTION_TOLERANCE) {
    return String(whole);
  }

  // Round to a reasonable precision
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

/**
 * Scale a quantity string by a given factor.
 *
 * Returns the scaled quantity string, or the original string if:
 * - The quantity is null/empty
 * - The quantity contains a non-scalable term
 * - The quantity cannot be parsed
 *
 * For ranges (e.g., "2-3 cups"), both bounds are scaled.
 */
export function scaleQuantity(
  quantity: string | null,
  factor: number
): string | null {
  if (!quantity) return quantity;

  const trimmed = quantity.trim();
  if (!trimmed) return quantity;
  if (isNonScalable(trimmed)) return quantity;
  if (factor === 1) return quantity;

  // Range pattern: scale both bounds
  const rangeMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(.*)$/
  );
  if (rangeMatch) {
    const low = Number(rangeMatch[1]!) * factor;
    const high = Number(rangeMatch[2]!) * factor;
    const unit = rangeMatch[3]!.trim();
    const formattedLow = formatQuantity(low);
    const formattedHigh = formatQuantity(high);
    return unit
      ? `${formattedLow}-${formattedHigh} ${unit}`
      : `${formattedLow}-${formattedHigh}`;
  }

  const parsed = parseQuantity(trimmed);
  if (!parsed) return quantity;

  const scaled = parsed.value * factor;
  const formatted = formatQuantity(scaled);
  return parsed.unit ? `${formatted} ${parsed.unit}` : formatted;
}
