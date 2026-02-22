import { categorizeIngredient } from '@/lib/ingredient-categories';

/**
 * Represents a single ingredient before aggregation.
 */
interface RawIngredient {
  name: string;
  quantity: string | null;
}

/**
 * Represents an ingredient after aggregation and categorization.
 */
export interface AggregatedItem {
  ingredientName: string;
  quantity: string | null;
  category: string;
}

/**
 * Parse a quantity string into a numeric value and unit.
 * Returns null if the quantity cannot be parsed.
 */
function parseQuantityForAggregation(
  quantity: string | null
): { value: number; unit: string } | null {
  if (!quantity) return null;

  const trimmed = quantity.trim();
  if (!trimmed) return null;

  // Match "2 cups", "1.5 tbsp", "3"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;

  const value = Number(match[1]!);
  const unit = match[2]!.trim().toLowerCase();
  if (isNaN(value)) return null;

  return { value, unit };
}

/**
 * Normalize an ingredient name for grouping.
 * Lowercases, trims, and performs basic singularization.
 */
function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Basic singularization for common patterns
  if (normalized.endsWith('ies')) {
    normalized = normalized.slice(0, -3) + 'y';
  } else if (
    normalized.endsWith('es') &&
    !normalized.endsWith('ses') &&
    !normalized.endsWith('ces')
  ) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Aggregate a list of raw ingredients by combining duplicates.
 * Ingredients with the same normalized name and compatible units are summed.
 * Each item is auto-categorized using the ingredient category map.
 */
export function aggregateIngredients(items: RawIngredient[]): AggregatedItem[] {
  const grouped = new Map<
    string,
    {
      originalName: string;
      quantities: { value: number; unit: string }[];
      rawQuantities: string[];
    }
  >();

  for (const item of items) {
    const normalized = normalizeIngredientName(item.name);
    const existing = grouped.get(normalized);

    if (!existing) {
      const parsed = parseQuantityForAggregation(item.quantity);
      grouped.set(normalized, {
        originalName: item.name,
        quantities: parsed ? [parsed] : [],
        rawQuantities: item.quantity ? [item.quantity] : [],
      });
    } else {
      const parsed = parseQuantityForAggregation(item.quantity);
      if (parsed) {
        existing.quantities.push(parsed);
      }
      if (item.quantity) {
        existing.rawQuantities.push(item.quantity);
      }
    }
  }

  const result: AggregatedItem[] = [];

  for (const [, group] of grouped) {
    let aggregatedQuantity: string | null = null;

    if (group.quantities.length > 0) {
      // Group by unit and sum
      const byUnit = new Map<string, number>();
      for (const q of group.quantities) {
        byUnit.set(q.unit, (byUnit.get(q.unit) ?? 0) + q.value);
      }

      if (byUnit.size === 1) {
        // All same unit — sum them
        const [unit, total] = [...byUnit.entries()][0]!;
        const formatted =
          total % 1 === 0
            ? String(total)
            : String(Math.round(total * 100) / 100);
        aggregatedQuantity = unit ? `${formatted} ${unit}` : formatted;
      } else {
        // Different units — join raw quantities
        aggregatedQuantity = group.rawQuantities.join(' + ');
      }
    } else if (group.rawQuantities.length > 0) {
      aggregatedQuantity = group.rawQuantities.join(' + ');
    }

    result.push({
      ingredientName: group.originalName,
      quantity: aggregatedQuantity,
      category: categorizeIngredient(group.originalName),
    });
  }

  return result;
}
