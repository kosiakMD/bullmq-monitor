import { basicAuth, evaluateAuth } from '../auth';
import type { AuthContext } from '../auth';

const ctx = (headers: Record<string, string> = {}): AuthContext => ({
  method: 'GET',
  path: '/admin/queues',
  headers,
  search: '',
});

const encode = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

describe('evaluateAuth', () => {
  it('allows everything when no guard is configured', async () => {
    await expect(evaluateAuth(undefined, ctx())).resolves.toBeNull();
  });
  it('allows the request when the guard returns true', async () => {
    await expect(evaluateAuth(() => true, ctx())).resolves.toBeNull();
  });
  it('refuses with 401 when the guard returns false', async () => {
    const response = await evaluateAuth(() => false, ctx());
    expect(response?.status).toBe(401);
    expect(response?.body).toBe('Unauthorized');
  });
  it('honours a custom status, headers and body', async () => {
    const response = await evaluateAuth(
      () => ({
        authorized: false,
        status: 403,
        headers: { 'x-reason': 'nope' },
        body: 'Forbidden',
      }),
      ctx()
    );
    expect(response).toMatchObject({
      status: 403,
      body: 'Forbidden',
    });
    expect(response?.headers['x-reason']).toBe('nope');
  });
  it('awaits an async guard', async () => {
    await expect(
      evaluateAuth(async () => Promise.resolve(true), ctx())
    ).resolves.toBeNull();
  });
  it('passes the request details to the guard', async () => {
    const guard = jest.fn().mockReturnValue(true);
    await evaluateAuth(guard, {
      method: 'POST',
      path: '/admin/queues/graphql',
      headers: { cookie: 'a=b' },
      search: '?x=1',
    });
    expect(guard).toHaveBeenCalledWith({
      method: 'POST',
      path: '/admin/queues/graphql',
      headers: { cookie: 'a=b' },
      search: '?x=1',
    });
  });
});

describe('basicAuth', () => {
  const guard = basicAuth({ users: { admin: 's3cret' }, realm: 'Queues' });

  it('challenges a request with no credentials', async () => {
    const response = await evaluateAuth(guard, ctx());
    expect(response?.status).toBe(401);
    expect(response?.headers['www-authenticate']).toContain('realm="Queues"');
  });
  it('accepts the right credentials', async () => {
    await expect(
      evaluateAuth(guard, ctx({ authorization: encode('admin', 's3cret') }))
    ).resolves.toBeNull();
  });
  it('rejects a wrong password', async () => {
    const response = await evaluateAuth(
      guard,
      ctx({ authorization: encode('admin', 'wrong') })
    );
    expect(response?.status).toBe(401);
  });
  it('rejects an unknown user', async () => {
    const response = await evaluateAuth(
      guard,
      ctx({ authorization: encode('nobody', 's3cret') })
    );
    expect(response?.status).toBe(401);
  });
  it('rejects a malformed header', async () => {
    for (const header of ['Basic', 'Bearer token', 'Basic bm9jb2xvbg==']) {
      const response = await evaluateAuth(
        guard,
        ctx({ authorization: header })
      );
      expect(response?.status).toBe(401);
    }
  });
  it('accepts passwords containing a colon', async () => {
    const colonGuard = basicAuth({ users: { admin: 'a:b:c' } });
    await expect(
      evaluateAuth(colonGuard, ctx({ authorization: encode('admin', 'a:b:c') }))
    ).resolves.toBeNull();
  });
  it('does not treat inherited object properties as users', async () => {
    const response = await evaluateAuth(
      guard,
      ctx({ authorization: encode('constructor', 's3cret') })
    );
    expect(response?.status).toBe(401);
  });
});
