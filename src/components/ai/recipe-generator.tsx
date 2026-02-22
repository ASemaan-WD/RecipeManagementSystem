'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Plus, Loader2, Save, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRecipeGenerator, useSaveAIRecipe } from '@/hooks/use-ai';
import type { AIGeneratedRecipe } from '@/types/ai';

const MAX_INGREDIENTS = 20;

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

function tryParseRecipe(content: string): AIGeneratedRecipe | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as AIGeneratedRecipe;
    if (parsed.name && parsed.ingredients && parsed.steps) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function RecipeGenerator() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [dietary, setDietary] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [servings, setServings] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<AIGeneratedRecipe | null>(
    null
  );

  const { content, isLoading, error, generate, reset } = useRecipeGenerator();
  const saveRecipe = useSaveAIRecipe();

  // Parse when streaming completes
  if (content && !isLoading && !parsedRecipe) {
    const recipe = tryParseRecipe(content);
    if (recipe) setParsedRecipe(recipe);
  }

  const handleAddIngredient = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || ingredients.length >= MAX_INGREDIENTS) return;
    if (ingredients.includes(trimmed.toLowerCase())) return;
    setIngredients((prev) => [...prev, trimmed.toLowerCase()]);
    setInputValue('');
  }, [inputValue, ingredients]);

  function handleRemoveIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  }

  function handleGenerate() {
    if (ingredients.length === 0) return;
    setParsedRecipe(null);

    generate({
      ingredients,
      ...(cuisine && { cuisine }),
      ...(dietary && { dietary }),
      ...(difficulty && { difficulty }),
      ...(servings && { servings: Number(servings) }),
    });
  }

  function handleSave() {
    if (!parsedRecipe) return;
    saveRecipe.mutate(
      { recipe: parsedRecipe },
      {
        onSuccess: (data) => {
          router.push(`/recipes/${data.id}`);
        },
      }
    );
  }

  function handleReset() {
    setParsedRecipe(null);
    reset();
  }

  return (
    <div className="space-y-6">
      {/* Ingredient input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type an ingredient and press Enter..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={100}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddIngredient}
              disabled={
                !inputValue.trim() || ingredients.length >= MAX_INGREDIENTS
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, index) => (
                <Badge
                  key={ing}
                  variant="secondary"
                  className="gap-1 pr-1 text-sm"
                >
                  {ing}
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="hover:bg-muted ml-0.5 rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            {ingredients.length}/{MAX_INGREDIENTS} ingredients
          </p>
        </CardContent>
      </Card>

      {/* Optional preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferences (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cuisine</label>
              <Input
                placeholder="e.g. Italian, Mexican..."
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dietary</label>
              <Input
                placeholder="e.g. Vegetarian, Gluten-free..."
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Servings</label>
              <Input
                type="number"
                placeholder="e.g. 4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                disabled={isLoading}
                min={1}
                max={50}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={ingredients.length === 0 || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Sparkles className="size-5" />
        )}
        {isLoading ? 'Generating Recipe...' : 'Generate Recipe'}
      </Button>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">
              {error.message || 'Something went wrong. Please try again.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleGenerate}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated recipe output */}
      {parsedRecipe && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{parsedRecipe.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="size-4" />
                  New Recipe
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveRecipe.isPending}
                >
                  {saveRecipe.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span className="hidden sm:inline">Save as New Recipe</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {parsedRecipe.description}
            </p>

            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span>Prep: {parsedRecipe.prepTime}m</span>
              <span>Cook: {parsedRecipe.cookTime}m</span>
              <span>Servings: {parsedRecipe.servings}</span>
              <span>
                Difficulty:{' '}
                {parsedRecipe.difficulty.charAt(0) +
                  parsedRecipe.difficulty.slice(1).toLowerCase()}
              </span>
              {parsedRecipe.cuisineType && (
                <span>Cuisine: {parsedRecipe.cuisineType}</span>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Ingredients</h3>
              <ul className="space-y-1">
                {parsedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{ing.quantity}</span>{' '}
                    {ing.name}
                    {ing.notes && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({ing.notes})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Steps</h3>
              <ol className="space-y-2">
                {parsedRecipe.steps.map((step) => (
                  <li key={step.stepNumber} className="text-sm">
                    <span className="font-medium">Step {step.stepNumber}:</span>{' '}
                    {step.instruction}
                    {step.duration && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({step.duration}m)
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-muted-foreground text-xs italic">
              AI-generated recipe. Review and adjust before cooking.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Streaming output (before parsing completes) */}
      {isLoading && content && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Generating your recipe...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
