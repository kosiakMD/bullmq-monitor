import { timingSafeEqual } from 'crypto';
import type { HttpGraphQLResponse } from './typings/config';

export type AuthContext = {
  method: string;
  /** path of the request, relative to the host */
  path: string;
  headers: Record<string, string | string[] | undefined>;
  /** raw query string, including the leading "?" (may be empty) */
  search: string;
};

export type AuthDecision =
  | boolean
  | {
      authorized: boolean;
      /** response status when not authorized. default 401 */
      status?: number;
      /** extra response headers, e.g. a WWW-Authenticate challenge */
      headers?: Record<string, string>;
      body?: string;
    };

/**
 * Guards every dashboard route: the page, its assets and the GraphQL endpoint.
 * Return false (or `{ authorized: false }`) to refuse the request.
 */
export type AuthGuard = (
  ctx: AuthContext
) => AuthDecision | Promise<AuthDecision>;

const DEFAULT_DENIED: HttpGraphQLResponse = {
  status: 401,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
  body: 'Unauthorized',
};

/** Normalizes whatever a guard returned into a response, or null when allowed. */
export async function evaluateAuth(
  guard: AuthGuard | undefined,
  ctx: AuthContext
): Promise<HttpGraphQLResponse | null> {
  if (!guard) return null;
  const decision = await guard(ctx);
  if (decision === true) return null;
  if (decision === false) return { ...DEFAULT_DENIED };
  if (decision.authorized) return null;
  return {
    status: decision.status ?? DEFAULT_DENIED.status,
    headers: { ...DEFAULT_DENIED.headers, ...decision.headers },
    body: decision.body ?? DEFAULT_DENIED.body,
  };
}

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // still compare, so the timing does not reveal the length
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
};

export type BasicAuthOptions = {
  /** username to password */
  users: Record<string, string>;
  /** shown by the browser's login prompt. default: "BullMQ Monitor" */
  realm?: string;
};

/**
 * HTTP basic auth guard. Fine for an internal dashboard behind TLS; put a real
 * identity provider in front of it for anything else.
 *
 * ```ts
 * new BullMonitorExpress({ queues, auth: basicAuth({ users: { admin: process.env.QUEUES_PASSWORD! } }) })
 * ```
 */
export function basicAuth({
  users,
  realm = 'BullMQ Monitor',
}: BasicAuthOptions): AuthGuard {
  const challenge = {
    'www-authenticate': `Basic realm="${realm.replace(/"/g, '')}", charset="UTF-8"`,
  };
  return ({ headers }) => {
    const raw = headers.authorization;
    const header = Array.isArray(raw) ? raw[0] : raw;
    if (!header?.startsWith('Basic ')) {
      return { authorized: false, headers: challenge };
    }
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator === -1) {
      return { authorized: false, headers: challenge };
    }
    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    const expected = Object.prototype.hasOwnProperty.call(users, user)
      ? users[user]
      : undefined;
    if (expected === undefined || !safeEqual(password, expected)) {
      return { authorized: false, headers: challenge };
    }
    return true;
  };
}
