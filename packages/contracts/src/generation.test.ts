import { describe, expect, it } from 'vitest';
import { CreateGenerationRequest } from './generation';

describe('CreateGenerationRequest', () => {
  it('fills in defaults for everything except the prompt', () => {
    // Arrange
    const input = { prompt: '  a lighthouse at dusk  ' };

    // Act
    const result = CreateGenerationRequest.parse(input);

    // Assert
    expect(result).toEqual({
      prompt: 'a lighthouse at dusk',
      negativePrompt: '',
      color: null,
      aspectRatio: '1:1',
      guidance: 7,
    });
  });

  it('rejects an empty prompt', () => {
    const result = CreateGenerationRequest.safeParse({ prompt: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects guidance that is not a multiple of 0.5', () => {
    const result = CreateGenerationRequest.safeParse({ prompt: 'x', guidance: 7.3 });
    expect(result.success).toBe(false);
  });

  it('rejects a colour outside the palette', () => {
    const result = CreateGenerationRequest.safeParse({ prompt: 'x', color: 'beige' });
    expect(result.success).toBe(false);
  });
});
