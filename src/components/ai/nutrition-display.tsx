'use client';

import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useNutritionEstimate, useEstimateNutrition } from '@/hooks/use-ai';
import type { AINutritionData } from '@/types/ai';

const NUTRITION_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbohydrates', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
] as const;

interface NutritionDisplayProps {
  recipeId: string;
  initialNutritionData: Record<string, unknown> | null;
  isOwner: boolean;
}

export function NutritionDisplay({
  recipeId,
  initialNutritionData,
  isOwner,
}: NutritionDisplayProps) {
  const { data: nutritionResponse } = useNutritionEstimate(
    recipeId,
    initialNutritionData as AINutritionData | null
  );
  const estimate = useEstimateNutrition();

  const nutritionData = nutritionResponse?.nutritionData ?? null;

  function handleEstimate() {
    estimate.mutate({ recipeId });
  }

  // No data yet — show estimate button
  if (!nutritionData) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Nutrition (per serving)</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-muted-foreground text-sm">
              No nutrition data available yet.
            </p>
            <Button
              variant="outline"
              onClick={handleEstimate}
              disabled={estimate.isPending}
            >
              {estimate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Estimate Nutrition with AI
            </Button>
            {estimate.error && (
              <p className="text-destructive text-sm">
                {estimate.error.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nutrition (per serving)</h2>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEstimate}
              disabled={estimate.isPending}
              title="Re-estimate nutrition"
            >
              {estimate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {NUTRITION_FIELDS.map(({ key, label, unit }) => {
            const value = nutritionData[key as keyof AINutritionData];
            if (value === undefined || value === null) return null;

            return (
              <div
                key={key}
                className="bg-muted/50 flex flex-col items-center rounded-lg p-3"
              >
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="text-lg font-semibold">{String(value)}</span>
                <span className="text-muted-foreground text-xs">{unit}</span>
              </div>
            );
          })}
        </div>

        {nutritionData.servingSize && (
          <p className="text-muted-foreground text-sm">
            Serving size: {nutritionData.servingSize}
          </p>
        )}

        <p className="text-muted-foreground text-xs italic">
          AI-generated estimates. For accurate values, consult a nutritionist.
        </p>
      </CardContent>
    </Card>
  );
}
