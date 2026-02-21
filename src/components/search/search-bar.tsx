'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultValue?: string;
  variant?: 'header' | 'page';
  onSearch?: (query: string) => void;
}

export function SearchBar({
  defaultValue = '',
  variant = 'page',
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  const isHeader = variant === 'header';

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isHeader) {
          inputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHeader]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (isHeader) {
      // Navigate to search page
      router.push(
        trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search'
      );
    } else {
      // Update in-place via callback
      onSearch?.(trimmed);
    }
  }

  function handleClear() {
    setValue('');
    inputRef.current?.focus();
    if (!isHeader) {
      onSearch?.('');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative', isHeader ? 'w-full' : 'w-full')}
    >
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn('pl-9', value ? 'pr-9' : isHeader ? 'pr-16' : 'pr-3')}
        aria-label="Search recipes"
      />

      {/* Clear button */}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}

      {/* Keyboard shortcut hint */}
      {!value && isHeader && (
        <kbd className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-medium select-none md:inline-block">
          Ctrl+K
        </kbd>
      )}
    </form>
  );
}
