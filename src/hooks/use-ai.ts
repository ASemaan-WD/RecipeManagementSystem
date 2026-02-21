import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  AIGeneratedRecipe,
  AISubstitutionResponse,
  AINutritionData,
} from '@/types/ai';

// ─── Recipe Generator ───

interface GenerateRecipeParams {
  ingredients: string[];
  cuisine?: string;
  dietary?: string;
  difficulty?: string;
  servings?: number;
}

interface UseRecipeGeneratorReturn {
  content: string;
  isLoading: boolean;
  error: Error | null;
  generate: (params: GenerateRecipeParams) => void;
  reset: () => void;
}

export function useRecipeGenerator(): UseRecipeGeneratorReturn {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: GenerateRecipeParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setContent('');
    setIsLoading(false);
    setError(null);
  }, []);

  return { content, isLoading, error, generate, reset };
}

// ─── Save AI Recipe ───

interface SaveAIRecipeParams {
  recipe: AIGeneratedRecipe;
}

async function saveRecipeFromAI(
  recipe: AIGeneratedRecipe
): Promise<{ id: string }> {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: recipe.name,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisineType: recipe.cuisineType,
      visibility: 'PRIVATE',
      ingredients: recipe.ingredients.map((ing, index) => ({
        name: ing.name,
        quantity: ing.quantity,
        notes: ing.notes ?? null,
        order: index,
      })),
      steps: recipe.steps.map((step) => ({
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        duration: step.duration ?? null,
      })),
      dietaryTagIds: [],
      images: [],
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to save recipe');
  }

  return res.json() as Promise<{ id: string }>;
}

export function useSaveAIRecipe() {
  return useMutation({
    mutationFn: ({ recipe }: SaveAIRecipeParams) => saveRecipeFromAI(recipe),
    onSuccess: () => {
      toast.success('Recipe saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ─── Ingredient Substitution ───

interface SubstitutionParams {
  ingredient: string;
  recipeContext?: string;
  dietaryRestrictions?: string;
}

async function fetchSubstitution(
  params: SubstitutionParams
): Promise<AISubstitutionResponse> {
  const res = await fetch('/api/ai/substitute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to find substitutions');
  }

  return res.json() as Promise<AISubstitutionResponse>;
}

export function useSubstitution() {
  return useMutation({
    mutationFn: fetchSubstitution,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ─── Nutrition Estimate ───

interface NutritionResponse {
  nutritionData: AINutritionData;
  cached: boolean;
}

async function fetchNutrition(recipeId: string): Promise<NutritionResponse> {
  const res = await fetch(`/api/ai/nutrition/${recipeId}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to estimate nutrition');
  }

  return res.json() as Promise<NutritionResponse>;
}

export function useNutritionEstimate(
  recipeId: string,
  initialData: AINutritionData | null
) {
  return useQuery({
    queryKey: ['nutrition', recipeId],
    queryFn: () => fetchNutrition(recipeId),
    initialData: initialData
      ? { nutritionData: initialData, cached: true }
      : undefined,
    enabled: !!initialData,
    staleTime: Infinity,
  });
}

export function useEstimateNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId }: { recipeId: string }) =>
      fetchNutrition(recipeId),
    onSuccess: (data, { recipeId }) => {
      queryClient.setQueryData(['nutrition', recipeId], data);
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      toast.success('Nutrition estimated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
