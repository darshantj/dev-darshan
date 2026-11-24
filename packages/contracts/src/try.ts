import { CreateGenerationRequest } from './index';

const good = CreateGenerationRequest.safeParse({
  prompt: '  a lighthouse at dusk  ',
  color: 'teal',
});
// eslint-disable-next-line no-console
console.log('good →', good.success, good.data);

const bad = CreateGenerationRequest.safeParse({ prompt: '', guidance: 7.3, color: 'beige' });
// eslint-disable-next-line no-console
console.log('bad →', bad.success);
// eslint-disable-next-line no-console
console.log(bad.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
