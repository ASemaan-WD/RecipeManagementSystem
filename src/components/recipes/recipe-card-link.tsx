'use client';

import { useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PREFETCH_DELAY_MS = 150;

interface RecipeCardLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function RecipeCardLink({
  href,
  children,
  className,
}: RecipeCardLinkProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    timeoutRef.current = setTimeout(() => {
      router.prefetch(href);
    }, PREFETCH_DELAY_MS);
  }, [href, router]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}
