import { UI } from '../ui';

describe('UI', () => {
  it('normalizes the base path', () => {
    expect(UI.normalizeBase(undefined)).toBe('');
    expect(UI.normalizeBase('/')).toBe('');
    expect(UI.normalizeBase('/admin/queues')).toBe('/admin/queues');
    expect(UI.normalizeBase('/admin/queues/')).toBe('/admin/queues');
  });
  it('renders asset urls relative to the mount path', () => {
    const html = new UI({ title: 'Test' }).render('/admin/queues');
    expect(html).toContain('/admin/queues/ui/main.js');
    expect(html).toContain('/admin/queues/ui/style.css');
    expect(html).toContain('content="/admin/queues/graphql"');
  });
  it('fingerprints assets by content so a rebuild busts the browser cache', () => {
    const html = new UI({ title: 'Test' }).render('');
    const version = new UI({ title: 'Test' }).version;
    const match = html.match(/main\.js\?v=([^"]+)/);
    expect(match).not.toBeNull();
    const stamp = match![1];
    // assets are present in a built package: expect a content hash, not the version
    if (new UI({ title: 'Test' }).assetsAvailable) {
      expect(stamp).toMatch(/^[0-9a-f]{12}$/);
      expect(stamp).not.toBe(version);
    }
  });
  it('renders asset urls at the root when mounted at /', () => {
    const html = new UI({ title: 'Test' }).render('/');
    expect(html).toContain('src="/ui/main.js');
    expect(html).toContain('content="/graphql"');
  });
  it('escapes the title', () => {
    const html = new UI({ title: '<script>alert(1)</script>' }).render('');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&#60;script&#62;');
  });
  it('renders favicon links and the branding meta tag', () => {
    const html = new UI({
      title: 'Queues',
      favicon: {
        default: '/static/icon.ico',
        alternative: '/static/icon-dark.svg',
      },
      logo: { path: '/static/logo.svg', width: 40 },
      links: [{ text: 'Admin', url: '/admin' }],
    }).render('/admin/queues');
    expect(html).toContain(
      '<link rel="icon" type="image/x-icon" href="/static/icon.ico" />'
    );
    expect(html).toContain('media="(prefers-color-scheme: dark)"');
    expect(html).toContain('name="bullmq-monitor:ui"');
    expect(html).toContain('&#34;logo&#34;');
  });
  it('omits the branding meta tag when nothing is configured', () => {
    const html = new UI().render('');
    expect(html).not.toContain('bullmq-monitor:ui');
    expect(html).not.toContain('rel="icon"');
    expect(html).toContain('<title>BullMQ Monitor</title>');
  });
  it('refuses to serve assets outside the ui directory', () => {
    const ui = new UI({ title: 'Test' });
    expect(ui.getAsset('../package.json')).toBeUndefined();
    expect(ui.getAsset('/etc/passwd')).toBeUndefined();
    expect(ui.getAsset('..\\package.json')).toBeUndefined();
    expect(ui.getAsset('')).toBeUndefined();
  });
});
