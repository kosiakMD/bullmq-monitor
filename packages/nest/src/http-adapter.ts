import type { HttpGraphQLResponse, UiAsset } from '@bullmq-monitor/root';

/**
 * Nest supports both Express and Fastify. Their request/response objects have
 * different APIs, so every platform-specific access goes through these helpers.
 */

export function requestUrl(req: any): string {
  return req?.originalUrl ?? req?.raw?.url ?? req?.url ?? '';
}

export function requestSearch(req: any): string {
  const url = requestUrl(req);
  const idx = url.indexOf('?');
  return idx === -1 ? '' : url.slice(idx);
}

export function requestHeaders(
  req: any
): Record<string, string | string[] | undefined> {
  return (req?.headers ?? req?.raw?.headers ?? {}) as Record<
    string,
    string | string[] | undefined
  >;
}

export function rawRequest(req: any): any {
  return req?.raw ?? req;
}

/** true when the framework already parsed a JSON body for us */
export function hasParsedBody(req: any): boolean {
  const body = req?.body;
  return body !== undefined && body !== null && body !== '';
}

function isFastifyReply(res: any): boolean {
  return typeof res?.code === 'function' && typeof res?.header === 'function';
}

export function sendHtml(res: any, html: string): void {
  if (isFastifyReply(res)) {
    res.header('Content-Type', 'text/html; charset=utf-8').send(html);
    return;
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

export function sendAsset(res: any, asset: UiAsset): void {
  const cacheControl = 'public, max-age=31536000, immutable';
  if (isFastifyReply(res)) {
    res
      .header('Content-Type', asset.contentType)
      .header('Cache-Control', cacheControl)
      .send(asset.body);
    return;
  }
  res.set('Content-Type', asset.contentType);
  res.set('Cache-Control', cacheControl);
  res.send(asset.body);
}

export function sendNotFound(res: any): void {
  if (isFastifyReply(res)) {
    res.code(404).header('Content-Type', 'text/plain').send('Not found');
    return;
  }
  res.status(404).set('Content-Type', 'text/plain').send('Not found');
}

export function sendGraphQL(res: any, result: HttpGraphQLResponse): void {
  if (isFastifyReply(res)) {
    res.code(result.status);
    for (const [key, value] of Object.entries(result.headers)) {
      res.header(key, value);
    }
    res.send(result.body);
    return;
  }
  res.status(result.status);
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  res.send(result.body);
}
