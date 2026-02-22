import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChefHat, Sparkles, Users, BookMarked, ArrowRight } from 'lucide-react';

import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Cooking',
    description:
      'Generate recipes from ingredients, get substitutions, and estimate nutrition with AI.',
  },
  {
    icon: Users,
    title: 'Share & Discover',
    description:
      'Share recipes with friends, browse community recipes, rate and comment.',
  },
  {
    icon: BookMarked,
    title: 'Organize Your Collection',
    description:
      'Tag favorites, plan meals, and create shopping lists from your recipes.',
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="bg-primary text-primary-foreground flex flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ChefHat className="mx-auto mb-6 size-16" />
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your AI-Powered Recipe Kitchen
          </h1>
          <p className="text-primary-foreground/80 mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
            Discover, create, and share delicious recipes with the help of
            artificial intelligence. Your personal cooking companion awaits.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Everything you need to cook with confidence
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-none">
                <CardHeader>
                  <div className="bg-primary/10 text-primary mb-2 w-fit rounded-lg p-3">
                    <feature.icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Join thousands of home cooks
          </h2>
          <p className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
            Start organizing your recipes, discovering new favorites, and
            cooking with confidence today.
          </p>
          <Button asChild size="lg">
            <Link href="/login">
              Create your free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="text-muted-foreground border-t py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Recipe Management System</p>
      </footer>
    </div>
  );
}
