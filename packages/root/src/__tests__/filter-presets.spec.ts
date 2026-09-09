import { UI } from '../ui';
import type { UiFilterPreset } from '../typings/config';

const presets: UiFilterPreset[] = [
  { label: 'Failed emails', status: 'failed', name: 'send-*' },
  {
    label: 'By organization',
    status: 'completed',
    dataSearch: 'data.organizationId = "{{value}}"',
    valueLabel: 'Organization id',
  },
];

describe('filter presets', () => {
  it('are handed to the dashboard in the branding meta tag', () => {
    const html = new UI({ filterPresets: presets }).render('/admin/queues');
    expect(html).toContain('name="bullmq-monitor:ui"');
    expect(html).toContain('&#34;filterPresets&#34;');
    expect(html).toContain('Failed emails');
  });

  it('keeps the value placeholder intact through html escaping', () => {
    const html = new UI({ filterPresets: presets }).render('');
    const meta = html.match(/name="bullmq-monitor:ui" content="([^"]*)"/)?.[1];
    expect(meta).toBeDefined();
    const decoded = meta!.replace(/&#(\d+);/g, (_m, code) =>
      String.fromCharCode(Number(code))
    );
    const parsed = JSON.parse(decoded);
    expect(parsed.filterPresets[1].dataSearch).toBe(
      'data.organizationId = "{{value}}"'
    );
    expect(parsed.filterPresets[0]).toEqual({
      label: 'Failed emails',
      status: 'failed',
      name: 'send-*',
    });
  });
});
