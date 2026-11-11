import { describe, it, expect } from 'vitest';
import { scoreEpds, epdsDue } from './epds';

const all = (pick: number) => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, pick]));

describe('EPDS scoring', () => {
  it('first option everywhere: items 1,2,4 score 0, reversed items score 3', () => {
    expect(scoreEpds(all(0)).total).toBe(21); // 7 reversed items x 3
  });
  it('last option everywhere', () => {
    expect(scoreEpds(all(3)).total).toBe(9); // 3 forward items x 3
  });
  it('lowest possible total is 0 and is low band', () => {
    const a = { ...all(3), 1: 0, 2: 0, 4: 0 };
    expect(scoreEpds(a)).toMatchObject({ total: 0, band: 'low', selfHarm: false });
  });
  it('bands at 10 and 13', () => {
    const base = { ...all(3), 1: 0, 2: 0, 4: 0 };
    expect(scoreEpds({ ...base, 1: 3, 2: 3, 4: 3, 3: 2 }).band).toBe('possible'); // 9 + 1 = 10
    expect(scoreEpds({ ...base, 1: 3, 2: 3, 4: 3, 3: 0, 5: 2 }).band).toBe('likely'); // 9 + 3 + 1 = 13
  });
  it('any answer above 0 on item 10 triggers safety', () => {
    const a = { ...all(3), 1: 0, 2: 0, 4: 0, 10: 2 };
    expect(scoreEpds(a).selfHarm).toBe(true);
  });
  it('rejects missing items', () => {
    expect(() => scoreEpds({ 1: 0 })).toThrow();
  });
});

describe('EPDS schedule', () => {
  it('due around 6 weeks if not done', () => expect(epdsDue(40, [])).toBe(42));
  it('not due if done in the window', () => expect(epdsDue(45, [41])).toBeNull());
  it('not due between windows', () => expect(epdsDue(70, [])).toBeNull());
});
