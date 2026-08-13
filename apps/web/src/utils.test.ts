import { describe, expect, it } from 'vitest';
import { cn } from './utils/cn';

describe('cn', () => {
  it('combines conditional UI classes', () => {
    expect(cn('card', false, 'active')).toBe('card active');
  });
});
