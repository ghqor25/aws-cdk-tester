import { existsSync } from 'fs';
import { dirname, format, parse, resolve } from 'path';
import { fileURLToPath } from 'url';

/** resolve path of lambda(esm) */
export const resolveESM = (importMeta: any, ...paths: string[]) => {
   const path = resolve(dirname(fileURLToPath((importMeta as { url: string }).url)), ...paths);
   const pathObject = parse(path);

   const pathJs = format({ dir: pathObject.dir, name: pathObject.name, ext: '.js' });
   const pathTs = format({ dir: pathObject.dir, name: pathObject.name, ext: '.ts' });

   if (existsSync(pathTs)) return pathTs;
   else if (existsSync(pathJs)) return pathJs;
   else throw new Error(`Neither JS or TS file exists. Input path: ${path}`);
};
