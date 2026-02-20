import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Heart,
  Bookmark,
  Plus,
  Users,
  FolderHeart,
  ChefHat,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TagStatus } from '@/generated/prisma/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [totalRecipes, favoriteCount, toTryCount] = await Promise.all([
    prisma.recipe.count({ where: { authorId: userId } }),
    prisma.userRecipeTag.count({
      where: { userId, status: TagStatus.FAVORITE },
    }),
    prisma.userRecipeTag.count({
      where: { userId, status: TagStatus.TO_TRY },
    }),
  ]);

  const stats = [
    { icon: BookOpen, title: 'Total Recipes', value: totalRecipes },
    { icon: Heart, title: 'Favorites', value: favoriteCount },
    { icon: Bookmark, title: 'To Try', value: toTryCount },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name || 'Chef'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your recipes.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.title}</CardDescription>
                <stat.icon className="text-muted-foreground size-5" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="size-4" />
              Add Recipe
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/community">
              <Users className="size-4" />
              Browse Community
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-collection">
              <FolderHeart className="size-4" />
              View Collection
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Recipes</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="text-muted-foreground mb-4 size-12" />
            <h3 className="text-lg font-medium">No recipes yet</h3>
            <p className="text-muted-foreground mt-1 mb-4 text-center text-sm">
              You haven&apos;t created any recipes yet. Get started by adding
              your first recipe!
            </p>
            <Button asChild>
              <Link href="/recipes/new">
                <Plus className="size-4" />
                Create Your First Recipe
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
