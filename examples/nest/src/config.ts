/**
 * Redis connection for the example. Kept local to this app rather than shared
 * with the other examples, because Nest compiles to JavaScript and cannot
 * import TypeScript sources from a sibling workspace package.
 */
export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const connection = { url: REDIS_URL } as any;
