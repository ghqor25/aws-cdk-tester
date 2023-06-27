import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/** resolve path of lambda(esm) */
export const resolveESM = (importMeta: any, ...paths: string[]) => resolve(dirname(fileURLToPath((importMeta as { url: string }).url)), ...paths);
