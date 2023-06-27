import * as assert from 'assert';

export const handler = async (event: any) => {
   console.log(JSON.stringify(event, null, 2));

   assert.deepStrictEqual({ hello: 'Stst' }, { sgsg: 'Sgsg' });

   return { body: 'hello' };
};
