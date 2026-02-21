import type { Prisma } from '@/generated/prisma/client';
import type { SearchFilterInput } from '@/lib/validations/search';

const MAX_QUERY_LENGTH = 200;
const TSQUERY_SPECIAL_CHARS = /[!&|():*'"]/g;
const COLLAPSE_SPACES = /\s+/g;

/**
 * Sanitize a search query by removing tsquery special characters,
 * trimming whitespace, collapsing multiple spaces, and truncating.
 */
export function sanitizeSearchQuery(query: string): string {
  const cleaned = query
    .replace(TSQUERY_SPECIAL_CHARS, '')
    .trim()
    .replace(COLLAPSE_SPACES, ' ');

  return cleaned.slice(0, MAX_QUERY_LENGTH);
}

/**
 * Build a PostgreSQL tsquery-compatible string from a user search query.
 * Words are AND-joined, and the last word gets prefix matching (`:*`).
 *
 * Example: "chicken pasta" → "chicken & pasta:*"
 */
export function buildTsQueryString(query: string): string {
  const sanitized = sanitizeSearchQuery(query);
  if (!sanitized) return '';

  const words = sanitized.split(' ').filter(Boolean);
  if (words.length === 0) return '';

  if (words.length === 1) return `${words[0]}:*`;

  const allButLast = words.slice(0, -1).join(' & ');
  const last = words[words.length - 1];
  return `${allButLast} & ${last}:*`;
}

/**
 * Build a Prisma `where` clause for non-FTS search filters.
 * FTS filtering (tsquery) is handled separately via raw SQL.
 */
export function buildSearchWhereClause(
  params: SearchFilterInput,
  userId?: string
): Prisma.RecipeWhereInput {
  const where: Prisma.RecipeWhereInput = {};

  // Visibility: authenticated sees own + public; guests see public only
  if (userId) {
    where.OR = [{ authorId: userId }, { visibility: 'PUBLIC' }];
  } else {
    where.visibility = 'PUBLIC';
  }

  if (params.cuisine) {
    where.cuisineType = { equals: params.cuisine, mode: 'insensitive' };
  }
  if (params.difficulty) {
    where.difficulty = params.difficulty;
  }
  if (params.maxPrepTime) {
    where.prepTime = { lte: params.maxPrepTime };
  }
  if (params.maxCookTime) {
    where.cookTime = { lte: params.maxCookTime };
  }
  if (params.minRating) {
    where.avgRating = { gte: params.minRating };
  }
  if (params.dietary && params.dietary.length > 0) {
    where.dietaryTags = {
      some: {
        dietaryTagId: { in: params.dietary },
      },
    };
  }

  return where;
}

/**
 * Build a Prisma `orderBy` clause for search results.
 * Returns `null` when sorting by relevance (handled by raw SQL rank).
 */
export function buildSearchOrderBy(
  sort: string,
  hasSearchQuery: boolean
): Prisma.RecipeOrderByWithRelationInput | null {
  if (hasSearchQuery && sort === 'relevance') return null;

  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' };
    case 'rating':
      return { avgRating: { sort: 'desc', nulls: 'last' } };
    case 'prepTime':
      return { prepTime: { sort: 'asc', nulls: 'last' } };
    case 'title':
      return { name: 'asc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}
