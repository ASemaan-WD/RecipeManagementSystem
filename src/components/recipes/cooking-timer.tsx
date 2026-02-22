'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CookingTimerProps {
  durationMinutes: number;
  stepNumber: number;
  onComplete?: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function playCompletionSound() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.8
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  } catch {
    // Audio not supported — silent fallback
  }
}

export function CookingTimer({
  durationMinutes,
  stepNumber,
  onComplete,
}: CookingTimerProps) {
  const totalMs = durationMinutes * 60 * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsRunning(false);
    setIsComplete(true);
    setRemainingMs(0);
    playCompletionSound();
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed =
        elapsedBeforePauseRef.current +
        (Date.now() - (startTimeRef.current ?? Date.now()));
      const remaining = totalMs - elapsed;

      if (remaining <= 0) {
        handleComplete();
      } else {
        setRemainingMs(remaining);
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, totalMs, handleComplete]);

  function handleStart() {
    if (isComplete) return;
    setIsRunning(true);
  }

  function handlePause() {
    if (!isRunning) return;
    const elapsed =
      elapsedBeforePauseRef.current +
      (Date.now() - (startTimeRef.current ?? Date.now()));
    elapsedBeforePauseRef.current = elapsed;
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    setIsComplete(false);
    setRemainingMs(totalMs);
    startTimeRef.current = null;
    elapsedBeforePauseRef.current = 0;
    completedRef.current = false;
  }

  const progress = 1 - remainingMs / totalMs;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        isComplete && 'border-green-500 bg-green-50 dark:bg-green-950'
      )}
      role="timer"
      aria-label={`Timer for step ${stepNumber}`}
    >
      <span
        className={cn(
          'font-mono text-lg font-bold tabular-nums',
          isComplete && 'text-green-600 dark:text-green-400'
        )}
      >
        {formatTime(remainingMs)}
      </span>

      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isComplete ? 'bg-green-500' : 'bg-primary'
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-1">
        {!isRunning && !isComplete && (
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handleStart}
            aria-label={`Start timer for step ${stepNumber}`}
          >
            <Play className="size-4" />
          </Button>
        )}
        {isRunning && (
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={handlePause}
            aria-label={`Pause timer for step ${stepNumber}`}
          >
            <Pause className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleReset}
          aria-label={`Reset timer for step ${stepNumber}`}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
