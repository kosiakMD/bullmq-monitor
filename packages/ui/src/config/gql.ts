import { EnvConfig } from './env';

const DEV_BASE_URL =
  (import.meta as any).env?.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql';

/**
 * The server renders <meta name="bullmq-monitor:graphql" content="..."> with the
 * exact GraphQL path for the mount point, so the dashboard works at any base url.
 * Falls back to deriving it from the current pathname for older servers.
 */
const readEndpointFromMeta = (): string | null => {
  if (typeof document === 'undefined') return null;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="bullmq-monitor:graphql"]'
  );
  const content = meta?.content?.trim();
  return content ? content : null;
};

const deriveFromPathname = (): string => {
  const { pathname } = window.location;
  const base = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return `${base}/graphql`;
};

const resolveEndpoint = (): string => {
  if (EnvConfig.dev) return DEV_BASE_URL;
  return readEndpointFromMeta() ?? deriveFromPathname();
};

export const GqlConfig = {
  endpoint: resolveEndpoint(),
};
