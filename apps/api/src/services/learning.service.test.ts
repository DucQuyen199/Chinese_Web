import { describe, expect, it } from 'vitest';
import { getLevel } from './learning.service.js';

describe('getLevel', () => {
  it('maps XP to the learner progression levels', () => {
    expect(getLevel(0)).toEqual({ number: 1, label: 'Beginner' });
    expect(getLevel(500)).toEqual({ number: 2, label: 'Explorer' });
    expect(getLevel(1500)).toEqual({ number: 3, label: 'Learner' });
    expect(getLevel(3000)).toEqual({ number: 4, label: 'Scholar' });
    expect(getLevel(5000)).toEqual({ number: 5, label: 'Master' });
  });
});
