import { z } from 'zod';
import { BaseConfig } from '@dev-darshan/platform';

export const ApiConfig = BaseConfig.extend({
  PORT: z.coerce.number().int().default(4000),
  HOST: z.string().default('127.0.0.1'),
});
export type ApiConfig = z.infer<typeof ApiConfig>;