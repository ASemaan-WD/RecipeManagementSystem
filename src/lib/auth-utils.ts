import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Visibility } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * Get the current authenticated user from the session.
 * Returns the user object or null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication for an API route.
 * Returns the session if authenticated, or a 401 NextResponse if not.
 *
 * Usage in API routes:
 *   const result = await requireAuth();
 *   if (result instanceof NextResponse) return result;
 *   const session = result;
 */
export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

/**
 * Verify that the current user owns a specific recipe.
 * Returns 401 if unauthenticated, 404 if recipe not found, 403 if not the owner.
 * Returns { session, recipe } on success.
 */
export async function requireRecipeOwner(recipeId: string) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  if (recipe.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { session, recipe };
}

/**
 * Check if the current user (or guest) can view a recipe based on visibility rules.
 * Access check chain:
 *   1. User is the recipe author
 *   2. Recipe visibility is PUBLIC
 *   3. User has a RecipeShare record
 *   4. Valid, active ShareLink token matches
 *   5. Deny with 404 (not 403, to prevent existence leaking)
 */
export async function canViewRecipe(recipeId: string, shareToken?: string) {
  const currentUser = await getCurrentUser();

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // 1. User is the recipe author
  if (currentUser && recipe.authorId === currentUser.id) {
    return { recipe, user: currentUser };
  }

  // 2. Recipe visibility is PUBLIC
  if (recipe.visibility === Visibility.PUBLIC) {
    return { recipe, user: currentUser };
  }

  // 3 & 4. Check RecipeShare and ShareLink in parallel when both are possible
  if (currentUser && shareToken) {
    const [share, shareLink] = await Promise.all([
      prisma.recipeShare.findUnique({
        where: {
          recipeId_userId: {
            recipeId: recipe.id,
            userId: currentUser.id,
          },
        },
      }),
      prisma.shareLink.findUnique({
        where: { token: shareToken },
      }),
    ]);
    if (share) return { recipe, user: currentUser };
    if (shareLink && shareLink.isActive && shareLink.recipeId === recipeId) {
      return { recipe, user: currentUser };
    }
  } else if (currentUser) {
    // 3. User has a RecipeShare record for this recipe
    const share = await prisma.recipeShare.findUnique({
      where: {
        recipeId_userId: {
          recipeId: recipe.id,
          userId: currentUser.id,
        },
      },
    });
    if (share) return { recipe, user: currentUser };
  } else if (shareToken) {
    // 4. Valid, active ShareLink token
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: shareToken },
    });
    if (shareLink && shareLink.isActive && shareLink.recipeId === recipeId) {
      return { recipe, user: currentUser };
    }
  }

  // 5. Deny access (use 404 to prevent existence leaking)
  return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
}
