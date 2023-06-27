import { findDuplicatedFirst } from './index.js';

describe('findDuplicatedFirst', () => {
   test('correct test', () => {
      expect(findDuplicatedFirst([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual(undefined);
   });
   test('wrong test', () => {
      expect(findDuplicatedFirst([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9])).toEqual(9);
   });
});
