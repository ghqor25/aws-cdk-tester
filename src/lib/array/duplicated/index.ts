export const findDuplicatedFirst = <T>(targetArray: T[]): T | undefined => {
   const targetCompare = [] as T[];

   for (const target of targetArray) {
      if (targetCompare.includes(target)) return target;
      else targetCompare.push(target);
   }

   return undefined;
};
