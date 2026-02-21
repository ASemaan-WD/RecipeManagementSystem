import { createOpenAI } from '@ai-sdk/openai';

const globalForOpenAI = globalThis as unknown as {
  openai: ReturnType<typeof createOpenAI> | undefined;
};

function createOpenAIProvider() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Vercel AI SDK OpenAI provider singleton */
export const openai = globalForOpenAI.openai ?? createOpenAIProvider();

if (process.env.NODE_ENV !== 'production') {
  globalForOpenAI.openai = openai;
}

/** Model used for text generation (recipe generation, substitutions, nutrition) */
export const TEXT_MODEL = 'gpt-4o-mini';

/** Model used for image generation (DALL-E) */
export const IMAGE_MODEL = 'dall-e-3';
