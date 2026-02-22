'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { ArrowLeft, ArrowRight, ChefHat, CookingPot, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CookingTimer } from '@/components/recipes/cooking-timer';
import { scaleQuantity } from '@/lib/scaling';
import type { RecipeDetail } from '@/types/recipe';

interface CookingModeProps {
  steps: RecipeDetail['steps'];
  ingredients: RecipeDetail['ingredients'];
  recipeName: string;
  scaleFactor?: number;
  onClose: () => void;
}

export function CookingMode({
  steps,
  ingredients,
  recipeName,
  scaleFactor = 1,
  onClose,
}: CookingModeProps) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeTimers, setActiveTimers] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const currentStep = sorted[currentIndex]!;
  const totalSteps = sorted.length;
  const progressPercent = ((currentIndex + 1) / totalSteps) * 100;

  const hasActiveTimers = activeTimers.size > 0;

  const handleExit = useCallback(() => {
    if (hasActiveTimers) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }, [hasActiveTimers, onClose]);

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleNext() {
    if (currentIndex < totalSteps - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleTimerStart(stepNumber: number) {
    setActiveTimers((prev) => new Set(prev).add(stepNumber));
  }

  function handleTimerComplete(stepNumber: number) {
    setActiveTimers((prev) => {
      const next = new Set(prev);
      next.delete(stepNumber);
      return next;
    });
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          handleExit();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake Lock not supported or permission denied — silent fallback
      }
    }

    requestWakeLock();

    return () => {
      wakeLock?.release();
    };
  }, []);

  // Touch swipe navigation
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = touch.clientX;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartRef.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const diff = touch.clientX - touchStartRef.current;
    const threshold = 50;
    if (diff > threshold) {
      handlePrevious();
    } else if (diff < -threshold) {
      handleNext();
    }
    touchStartRef.current = null;
  }

  const sortedIngredients = [...ingredients].sort((a, b) => a.order - b.order);

  return (
    <>
      <div
        ref={containerRef}
        className="bg-background fixed inset-0 z-50 flex flex-col"
        role="dialog"
        aria-label={`Cooking mode for ${recipeName}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="text-primary size-5" />
              <span className="text-sm font-medium">
                Step {currentIndex + 1} of {totalSteps}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              aria-label="Exit cooking mode"
            >
              <X className="size-5" />
            </Button>
          </div>
          <Progress value={progressPercent} className="mt-2" />
        </div>

        {/* Step Content */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 sm:p-10">
          <div className="max-w-2xl space-y-6 text-center">
            <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-full text-lg font-bold">
              {currentStep.stepNumber}
            </div>
            <p className="text-xl leading-relaxed sm:text-2xl">
              {currentStep.instruction}
            </p>
            {currentStep.duration && (
              <div className="mx-auto max-w-sm">
                <CookingTimer
                  durationMinutes={currentStep.duration}
                  stepNumber={currentStep.stepNumber}
                  onComplete={() => handleTimerComplete(currentStep.stepNumber)}
                />
                {!activeTimers.has(currentStep.stepNumber) && (
                  <button
                    className="sr-only"
                    onFocus={() => handleTimerStart(currentStep.stepNumber)}
                  >
                    Track timer for step {currentStep.stepNumber}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <Button
              variant="outline"
              size="lg"
              className="min-h-[44px] min-w-[44px] gap-2"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              aria-label="Previous step"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="min-h-[44px] gap-2"
                  aria-label="Show ingredients"
                >
                  <CookingPot className="size-4" />
                  <span className="hidden sm:inline">Ingredients</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[60vh]">
                <div className="space-y-3 overflow-y-auto p-4">
                  <h3 className="text-lg font-semibold">Ingredients</h3>
                  <ul className="space-y-2">
                    {sortedIngredients.map((ingredient) => {
                      const displayQuantity =
                        scaleFactor !== 1
                          ? scaleQuantity(ingredient.quantity, scaleFactor)
                          : ingredient.quantity;

                      return (
                        <li
                          key={ingredient.id}
                          className="text-sm leading-relaxed"
                        >
                          <span className="font-medium">{ingredient.name}</span>
                          {displayQuantity && (
                            <span className="text-muted-foreground">
                              {' '}
                              — {displayQuantity}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant={currentIndex === totalSteps - 1 ? 'default' : 'outline'}
              size="lg"
              className="min-h-[44px] min-w-[44px] gap-2"
              onClick={
                currentIndex === totalSteps - 1 ? handleExit : handleNext
              }
              aria-label={
                currentIndex === totalSteps - 1 ? 'Finish cooking' : 'Next step'
              }
            >
              <span className="hidden sm:inline">
                {currentIndex === totalSteps - 1 ? 'Finish' : 'Next'}
              </span>
              {currentIndex < totalSteps - 1 && (
                <ArrowRight className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Cooking Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              You have active timers running. Are you sure you want to exit? All
              timers will be stopped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Cooking</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Exit Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
