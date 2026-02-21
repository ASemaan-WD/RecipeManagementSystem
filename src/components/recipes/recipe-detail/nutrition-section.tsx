import { Card, CardContent, CardHeader } from '@/components/ui/card';

const NUTRITION_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
] as const;

interface NutritionSectionProps {
  nutritionData: Record<string, unknown> | null;
}

export function NutritionSection({ nutritionData }: NutritionSectionProps) {
  if (!nutritionData) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Nutrition (per serving)</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {NUTRITION_FIELDS.map(({ key, label, unit }) => {
            const value = nutritionData[key];
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

        <p className="text-muted-foreground text-xs italic">
          AI-generated estimates. For accurate values, consult a nutritionist.
        </p>
      </CardContent>
    </Card>
  );
}
