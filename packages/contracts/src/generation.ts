import { z } from 'zod';

export const PALETTE = ['crimson', 'amber', 'lime', 'teal', 'azure', 'violet', 'rose'] as const;
export const ColorId = z.enum(PALETTE);

export const AspectRatio = z.enum(['1:1', '4:3', '3:4', '16:9', '9:16']);

export const CreateGenerationRequest = z.object({
  prompt: z.string().trim().min(1).max(1000),
  negativePrompt: z.string().trim().max(500).default(''),
  color: ColorId.nullable().default(null),
  aspectRatio: AspectRatio.default('1:1'),
  guidance: z.number().min(1).max(20).multipleOf(0.5).default(7),
  seed: z.number().int().min(0).max(4_294_967_295).optional(),
});

// What a client may send (defaults not yet applied)
export type CreateGenerationInput = z.input<typeof CreateGenerationRequest>;
// What the server works with after parse() (defaults filled in)
export type CreateGenerationRequest = z.infer<typeof CreateGenerationRequest>;
