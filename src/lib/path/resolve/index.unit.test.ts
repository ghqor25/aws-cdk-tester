import { resolveESM } from './index.js';

describe('resolveESM', () => {
   test('random', () => {
      expect(resolveESM(import.meta, 'lambda', 'test.ts')).toBe('');
   });
});
