import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function FormProgress({
  currentStep,
  totalSteps,
  stepLabels,
}: FormProgressProps) {
  return (
    <div className="w-full">
      {/* Mobile: simple text */}
      <p className="text-muted-foreground text-sm sm:hidden">
        Step {currentStep + 1} of {totalSteps} —{' '}
        <span className="text-foreground font-medium">
          {stepLabels[currentStep]}
        </span>
      </p>

      {/* Desktop: full step bar */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary text-primary',
                    !isCompleted &&
                      !isActive &&
                      'border-muted-foreground/30 text-muted-foreground/50'
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    isActive && 'text-foreground font-medium',
                    isCompleted && 'text-foreground',
                    !isCompleted && !isActive && 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    'mx-2 mb-5 h-0.5 flex-1 transition-colors',
                    index < currentStep
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
