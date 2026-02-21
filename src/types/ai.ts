export interface AIGeneratedRecipe {
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cuisineType: string;
  ingredients: {
    name: string;
    quantity: string;
    notes?: string;
  }[];
  steps: {
    stepNumber: number;
    instruction: string;
    duration?: number;
  }[];
}

export interface AISubstitution {
  name: string;
  ratio: string;
  notes: string;
}

export interface AISubstitutionResponse {
  substitutions: AISubstitution[];
}

export interface AINutritionData {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servingSize: string | null;
}

export interface AIRateLimitInfo {
  remaining: number;
  resetAt: string;
}
