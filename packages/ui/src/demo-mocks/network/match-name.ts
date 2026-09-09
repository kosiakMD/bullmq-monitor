import type { Maybe } from '@/typings/utils';

/**
 * Mirrors the server-side job name filter so the mocked demo behaves
 * like a real deployment: substring match, or glob when "*" is present.
 */
export const matchesJobName = (
  jobName: string,
  filter?: Maybe<string>
): boolean => {
  const needle = filter?.trim();
  if (!needle) return true;
  if (needle.includes('*')) {
    const pattern = needle
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${pattern}$`, 'i').test(jobName ?? '');
  }
  return (jobName ?? '').toLowerCase().includes(needle.toLowerCase());
};
