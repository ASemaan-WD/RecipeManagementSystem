import type {
  Difficulty,
  Visibility,
  ImageSource,
  TagStatus,
} from '@/generated/prisma/client';

// ─── Form Input Types ───

export interface RecipeIngredientInput {
  name: string;
  quantity: string;
  unit?: string;
  notes?: string;
  order: number;
}

export interface RecipeStepInput {
  instruction: string;
  duration?: number;
  stepNumber: number;
}

export interface RecipeImageInput {
  url: string;
  source: ImageSource;
  isPrimary: boolean;
  order: number;
}

export interface RecipeFormData {
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  cuisineType: string;
  visibility: Visibility;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStepInput[];
  dietaryTagIds: string[];
  images: RecipeImageInput[];
}

// ─── Display Types ───

export interface RecipeListItem {
  id: string;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  cuisineType: string | null;
  visibility: Visibility;
  avgRating: number | null;
  ratingCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  primaryImage: { url: string } | null;
  dietaryTags: { id: string; name: string }[];
  userTags?: { status: TagStatus }[];
  isSaved?: boolean;
}

export interface RecipeDetail extends RecipeListItem {
  nutritionData: Record<string, unknown> | null;
  updatedAt: string;
  images: {
    id: string;
    url: string;
    source: ImageSource;
    isPrimary: boolean;
    order: number;
  }[];
  ingredients: {
    id: string;
    name: string;
    quantity: string | null;
    notes: string | null;
    order: number;
  }[];
  steps: {
    id: string;
    stepNumber: number;
    instruction: string;
    duration: number | null;
  }[];
}

// ─── Filter & Pagination Types ───

export interface RecipeFilters {
  page?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  difficulty?: Difficulty;
  maxPrepTime?: number;
  maxCookTime?: number;
  dietary?: string[];
  minRating?: number;
  sort?: string;
  visibility?: Visibility;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
