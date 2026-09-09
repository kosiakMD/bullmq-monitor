import type { IncomingMessage } from 'http';
import { HeaderMap } from '@apollo/server';
import type { HttpGraphQLRequest } from './typings/config';

const DEFAULT_BODY_LIMIT = 1024 * 1024; // 1mb

/**
 * Reads and parses a JSON body from a raw node request.
 * Used by adapters whose framework doesn't parse the body for us.
 */
export function readJsonBody(
  req: IncomingMessage,
  limit = DEFAULT_BODY_LIMIT
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (_e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function toHeaderMap(headers: HttpGraphQLRequest['headers']): HeaderMap {
  const map = new HeaderMap();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    map.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  return map;
}

export function extractSearch(url: string | undefined): string {
  if (!url) return '';
  const idx = url.indexOf('?');
  return idx === -1 ? '' : url.slice(idx);
}
