import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DEFAULT_UI_TITLE, GQL_PATH, UI_ASSETS_PATH } from './constants';
import type { UiAsset, UiConfig } from './typings/config';

const pkg = require('../package.json');

const MIME: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const escapeHtml = (str: string) =>
  str.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const iconType = (url: string): string => {
  const ext = url.split('?')[0].split('#')[0].slice(url.lastIndexOf('.'));
  return MIME[ext] || 'image/x-icon';
};

/**
 * Renders the dashboard shell and serves the bundled static assets.
 * Assets live in <package root>/ui and are copied there from @bullmq-monitor/ui
 * during the build, so no CDN is required at runtime.
 */
export class UI {
  public readonly version: string = pkg.version;
  private readonly _assetsDir = path.resolve(__dirname, '..', UI_ASSETS_PATH);
  private _assetsCache = new Map<string, UiAsset>();
  private _fingerprints = new Map<string, string>();

  constructor(private _config: UiConfig = {}) {}

  /** normalizes "/some/url/" -> "/some/url" and "" -> "" */
  public static normalizeBase(base?: string): string {
    if (!base || base === '/') return '';
    return base.endsWith('/') ? base.slice(0, -1) : base;
  }

  public get title(): string {
    return this._config.title || DEFAULT_UI_TITLE;
  }

  /**
   * Short content hash used to bust the browser cache. Assets are served with a
   * one year immutable cache, so the url has to change whenever the file does.
   * Keying on the package version alone would serve a stale bundle after any
   * rebuild that did not bump the version.
   */
  private fingerprint(fileName: string): string {
    const cached = this._fingerprints.get(fileName);
    if (cached) return cached;
    const filePath = path.join(this._assetsDir, fileName);
    let hash = this.version;
    try {
      hash = crypto
        .createHash('sha1')
        .update(fs.readFileSync(filePath))
        .digest('hex')
        .slice(0, 12);
    } catch (_e) {
      // asset missing: fall back to the package version
    }
    this._fingerprints.set(fileName, hash);
    return hash;
  }

  public render(basePath?: string): string {
    const base = UI.normalizeBase(basePath);
    const asset = (file: string) =>
      `${base}/${UI_ASSETS_PATH}/${file}?v=${this.fingerprint(file)}`;
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(this.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="bullmq-monitor:graphql" content="${escapeHtml(`${base}/${GQL_PATH}`)}" />${this.uiConfigMeta()}${this.faviconTags()}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <link rel="stylesheet" href="${asset('style.css')}" />
    <script type="module" src="${asset('main.js')}"></script>
  </head>
  <body>
    <div id="root"></div>
    <noscript>You need to enable JavaScript to run this app.</noscript>
  </body>
</html>
`;
  }

  /**
   * Serialises the branding the host application configured. The dashboard
   * reads it on boot and uses it as the default appearance.
   */
  private uiConfigMeta(): string {
    if (!this._config || !Object.keys(this._config).length) return '';
    return `\n    <meta name="bullmq-monitor:ui" content="${escapeHtml(
      JSON.stringify(this._config)
    )}" />`;
  }

  /** favicon links, rendered server-side so the tab icon is right on first paint */
  private faviconTags(): string {
    const favicon = this._config.favicon;
    if (!favicon?.default) return '';
    const tags = [
      `\n    <link rel="icon" type="${iconType(favicon.default)}" href="${escapeHtml(favicon.default)}" />`,
    ];
    if (favicon.alternative) {
      tags.push(
        `\n    <link rel="icon" type="${iconType(favicon.alternative)}" href="${escapeHtml(favicon.alternative)}" media="(prefers-color-scheme: dark)" />`
      );
    }
    return tags.join('');
  }

  /**
   * Returns a bundled asset by file name. Only plain file names are accepted,
   * so directory traversal is impossible.
   */
  public getAsset(fileName: string): UiAsset | undefined {
    if (!fileName || /[/\\]/.test(fileName) || fileName.startsWith('.')) {
      return undefined;
    }
    const cached = this._assetsCache.get(fileName);
    if (cached) return cached;
    const filePath = path.join(this._assetsDir, fileName);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return undefined;
    }
    const asset: UiAsset = {
      body: fs.readFileSync(filePath),
      contentType: MIME[path.extname(fileName)] || 'application/octet-stream',
    };
    this._assetsCache.set(fileName, asset);
    return asset;
  }

  public get assetsAvailable(): boolean {
    return fs.existsSync(path.join(this._assetsDir, 'main.js'));
  }
}
