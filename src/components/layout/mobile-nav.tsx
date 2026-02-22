'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FolderHeart,
  ShoppingCart,
  PlusCircle,
  Search,
  Settings,
  LogOut,
  LogIn,
  ChefHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggleMenuItem } from '@/components/layout/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'My Recipes', href: '/my-recipes', icon: BookOpen },
  { label: 'Community', href: '/community', icon: Users },
  { label: 'My Collection', href: '/my-collection', icon: FolderHeart },
  { label: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
  { label: 'Add Recipe', href: '/recipes/new', icon: PlusCircle },
] as const;

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  isAuthenticated: boolean;
}

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

export function MobileNav({
  open,
  onOpenChange,
  user,
  isAuthenticated,
}: MobileNavProps) {
  function handleLinkClick() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <Link
              href={isAuthenticated ? '/dashboard' : '/'}
              onClick={handleLinkClick}
              className="flex items-center gap-2"
            >
              <ChefHat className="size-6" />
              <span>RecipeApp</span>
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>

        {/* User info section */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3 px-4">
            <Avatar>
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? 'User avatar'}
              />
              <AvatarFallback>
                {getUserInitials(user.name, user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              {user.username && (
                <span className="text-muted-foreground text-xs">
                  @{user.username}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav
          className="flex flex-col gap-1 px-4"
          aria-label="Mobile navigation"
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="h-11 justify-start gap-3"
              asChild
            >
              <Link href={item.href} onClick={handleLinkClick}>
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </Button>
          ))}

          <Separator className="my-2" />

          <Button variant="ghost" className="h-11 justify-start gap-3" asChild>
            <Link href="/settings" onClick={handleLinkClick}>
              <Settings className="size-5" />
              Settings
            </Link>
          </Button>

          <ThemeToggleMenuItem />
        </nav>

        {/* Sign Out / Sign In */}
        <SheetFooter>
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-3"
              onClick={() => {
                handleLinkClick();
                signOut({ callbackUrl: '/' });
              }}
            >
              <LogOut className="size-5" />
              Sign Out
            </Button>
          ) : (
            <Button className="h-11 w-full" asChild>
              <Link href="/login" onClick={handleLinkClick}>
                <LogIn className="size-5" />
                Sign In
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
