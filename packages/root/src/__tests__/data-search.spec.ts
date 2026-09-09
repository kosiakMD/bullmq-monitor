import { buildNameMatcher, buildJsonataMatcher } from '../data-search';
import type { Job } from '../queue';

const makeJob = (raw: any): Job => ({ rawJob: raw, name: raw.name }) as Job;

describe('buildNameMatcher', () => {
  it('returns undefined for an empty filter', () => {
    expect(buildNameMatcher(undefined)).toBeUndefined();
    expect(buildNameMatcher('')).toBeUndefined();
    expect(buildNameMatcher('   ')).toBeUndefined();
  });
  it('matches a case-insensitive substring', () => {
    const match = buildNameMatcher('email')!;
    expect(match('send-email-job')).toBe(true);
    expect(match('SEND-EMAIL')).toBe(true);
    expect(match('send-sms')).toBe(false);
  });
  it('supports trailing wildcards', () => {
    const match = buildNameMatcher('send-*')!;
    expect(match('send-email')).toBe(true);
    expect(match('send-')).toBe(true);
    expect(match('resend-email')).toBe(false);
  });
  it('supports leading wildcards', () => {
    const match = buildNameMatcher('*-retry')!;
    expect(match('email-retry')).toBe(true);
    expect(match('retry-email')).toBe(false);
  });
  it('escapes regex metacharacters outside wildcards', () => {
    const match = buildNameMatcher('job.a*')!;
    expect(match('job.abc')).toBe(true);
    expect(match('jobXabc')).toBe(false);
  });
  it('handles jobs without a name', () => {
    const match = buildNameMatcher('email')!;
    expect(match(undefined as unknown as string)).toBe(false);
  });
});

describe('buildJsonataMatcher', () => {
  it('returns undefined for an empty expression', () => {
    expect(buildJsonataMatcher(undefined)).toBeUndefined();
    expect(buildJsonataMatcher('  ')).toBeUndefined();
  });
  it('matches by job data', async () => {
    const match = buildJsonataMatcher('data.userId = 42')!;
    await expect(
      match(makeJob({ name: 'a', data: { userId: 42 } }))
    ).resolves.toBe(true);
    await expect(
      match(makeJob({ name: 'a', data: { userId: 1 } }))
    ).resolves.toBe(false);
  });
  it('never throws on an invalid expression', async () => {
    const match = buildJsonataMatcher('this is (not jsonata')!;
    await expect(match(makeJob({ name: 'a' }))).resolves.toBe(false);
  });
  it('treats an empty object result as no match', async () => {
    const match = buildJsonataMatcher('data.missing')!;
    await expect(match(makeJob({ name: 'a', data: {} }))).resolves.toBe(false);
  });
});
