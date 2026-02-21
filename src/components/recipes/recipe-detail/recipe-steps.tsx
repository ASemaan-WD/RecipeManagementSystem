import { Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { RecipeDetail } from '@/types/recipe';

interface RecipeStepsProps {
  steps: RecipeDetail['steps'];
}

export function RecipeSteps({ steps }: RecipeStepsProps) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Instructions</h2>
      </CardHeader>
      <CardContent>
        <ol className="space-y-6">
          {sorted.map((step) => (
            <li key={step.id} className="flex gap-4">
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {step.stepNumber}
              </div>
              <div className="flex-1 space-y-1.5 pt-0.5">
                <p className="leading-relaxed">{step.instruction}</p>
                {step.duration && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3" />~{step.duration} min
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
