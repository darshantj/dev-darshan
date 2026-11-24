import { CreateGenerationRequest } from './index';

const good = CreateGenerationRequest.safeParse({ prompt: '  a lighthouse at dusk  ', color: 'teal' });
console.log('good →', good.success, good.data);

const bad = CreateGenerationRequest.safeParse({ prompt: '', guidance: 7.3, color: 'beige' });
console.log('bad →', bad.success);
console.log(bad.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`));