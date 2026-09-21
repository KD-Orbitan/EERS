import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText, filename);
};
const { descriptionHtml, descriptionExcerpt } = require('../app/lib/business-description.ts');
const legacy = 'Coffee & tea < 50,000 VND\nOpen daily';
assert.equal(descriptionHtml(legacy), '<p>Coffee &amp; tea &lt; 50,000 VND<br />Open daily</p>');
const article = '<h2>About us</h2><p><strong>Coffee</strong> and <em>tea</em></p><ul><li>Wi-Fi</li><li>Parking</li></ul>';
assert.equal(descriptionHtml(article), article);
assert.equal(descriptionHtml(descriptionHtml(article)), article);
assert.equal(descriptionExcerpt(article), 'About us Coffee and tea Wi-Fi Parking');
const malicious = '<script>alert(1)</script><p onclick="alert(2)" style="position:fixed">Hello</p><img src=x onerror=alert(3)><iframe src="https://example.com"></iframe><a href="javascript:alert(4)">Click</a>';
const safe = descriptionHtml(malicious);
assert.ok(!/script|onclick|onerror|style=|<img|<iframe|javascript:/i.test(safe));
for (const href of ['javascript:alert(1)', 'java&#x73;cript:alert(1)', 'data:text/html,hello', '//example.com']) {
  assert.ok(!descriptionHtml(`<a href="${href}">Link</a>`).includes('href='));
}
const link = descriptionHtml('<p><a href="https://example.com">Visit us</a></p>');
assert.ok(link.includes('rel="noopener noreferrer nofollow"'));
assert.equal(descriptionExcerpt(link), 'Visit us');
assert.equal(descriptionExcerpt('<p>One &amp; two</p><p>Three</p>'), 'One &amp; two Three');
assert.equal(descriptionExcerpt('<p><br></p>'), '');
console.log('Business description: legacy text, rich formatting, round trips, excerpts and unsafe HTML tests passed.');
