'use client';

import { useState } from 'react';

import { Minus, Plus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

interface ServingAdjusterProps {
  originalServings: number;
  onScaleFactorChange: (factor: number) => void;
}

export function ServingAdjuster({
  originalServings,
  onScaleFactorChange,
}: ServingAdjusterProps) {
  const [currentServings, setCurrentServings] = useState(originalServings);

  const isModified = currentServings !== originalServings;

  function handleDecrease() {
    const next = Math.max(MIN_SERVINGS, currentServings - 1);
    setCurrentServings(next);
    onScaleFactorChange(next / originalServings);
  }

  function handleIncrease() {
    const next = Math.min(MAX_SERVINGS, currentServings + 1);
    setCurrentServings(next);
    onScaleFactorChange(next / originalServings);
  }

  function handleReset() {
    setCurrentServings(originalServings);
    onScaleFactorChange(1);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Servings:</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleDecrease}
          disabled={currentServings <= MIN_SERVINGS}
          aria-label="Decrease servings"
        >
          <Minus className="size-4" />
        </Button>
        <span className="min-w-[2rem] text-center text-sm font-semibold">
          {currentServings}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleIncrease}
          disabled={currentServings >= MAX_SERVINGS}
          aria-label="Increase servings"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {isModified && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={handleReset}
          aria-label="Reset servings"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      )}
    </div>
  );
}
