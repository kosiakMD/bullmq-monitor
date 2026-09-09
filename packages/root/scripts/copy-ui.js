/* Copies the built dashboard (packages/ui/build) into packages/root/ui so that
 * the adapters can serve it without any CDN. */
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../../ui/build');
const dst = path.resolve(__dirname, '../ui');

if (!fs.existsSync(path.join(src, 'main.js'))) {
  console.error(
    `[@bullmq-monitor/root] UI build not found at ${src}. Run "npm run build -w packages/ui" first.`
  );
  process.exit(1);
}
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
for (const file of fs.readdirSync(src)) {
  const from = path.join(src, file);
  if (fs.statSync(from).isFile()) {
    fs.copyFileSync(from, path.join(dst, file));
  }
}
console.log(`[@bullmq-monitor/root] UI assets copied to ${dst}`);
