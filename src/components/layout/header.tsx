'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  Menu,
  Plus,
  BookOpen,
  Users,
  ShoppingCart,
  FolderHeart,
  Settings,
  LogOut,
  LogIn,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SearchBar } from '@/components/search/search-bar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ThemeToggleMenuItem } from '@/components/layout/theme-toggle';

const DESKTOP_NAV_ITEMS = [
  { label: 'My Recipes', href: '/my-recipes', icon: BookOpen },
  { label: 'My Collection', href: '/my-collection', icon: FolderHeart },
  { label: 'Community', href: '/community', icon: Users },
  { label: 'AI Generate', href: '/ai/generate', icon: Sparkles },
  { label: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
] as const;

const USER_MENU_ITEMS = [
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

function getUserInitials(
  name: string | null | undefined,
  username: string | null | undefined
): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function Header() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;

  return (
    <>
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>

          {/* Logo */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2 font-semibold"
          >
            <ChefHat className="size-6" />
            <span className="hidden sm:inline-block">RecipeApp</span>
          </Link>

          {/* Search bar (desktop) */}
          <div className="mx-4 hidden flex-1 md:flex md:max-w-md lg:max-w-lg">
            <SearchBar variant="header" />
          </div>

          {/* Right section */}
          <div className="ml-auto flex items-center gap-1">
            {/* Mobile search icon */}
            <Button variant="ghost" size="icon" className="md:hidden" asChild>
              <Link href="/search" aria-label="Search recipes">
                <Search className="size-5" />
              </Link>
            </Button>
            {/* Desktop nav links */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Main navigation"
            >
              {DESKTOP_NAV_ITEMS.map((item) => (
                <Button key={item.href} variant="ghost" size="sm" asChild>
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            {/* Add Recipe CTA (desktop, authenticated only) */}
            {isAuthenticated && (
              <Button size="sm" className="hidden md:inline-flex" asChild>
                <Link href="/recipes/new">
                  <Plus className="size-4" />
                  Add Recipe
                </Link>
              </Button>
            )}

            {/* User menu / Sign In / Loading */}
            {isLoading ? (
              <div className="bg-muted size-8 animate-pulse rounded-full" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar size="sm">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name ?? 'User avatar'}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.name, user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm leading-none font-medium">
                        {user.name}
                      </p>
                      {user.username && (
                        <p className="text-muted-foreground text-xs leading-none">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {USER_MENU_ITEMS.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <ThemeToggleMenuItem />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">
                  <LogIn className="size-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        user={isAuthenticated && user ? user : null}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
