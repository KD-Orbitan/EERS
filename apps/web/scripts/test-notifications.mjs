import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const loadModule = createRequire(import.meta.url);

// Small regression runner using the project's existing TypeScript and React dependencies.
for (const extension of ['.ts', '.tsx']) {
  loadModule.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const result = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } });
    module._compile(result.outputText, filename);
  };
}

const { notificationTarget } = loadModule('../app/features/notification/lib/notification-target.ts');
const { NotificationItem } = loadModule('../app/features/notification/components/notification-item.tsx');
const base = { notificationId: 7, type: 'NEW_REPLY', title: 'New reply', content: 'The owner replied.',
  isRead: false, createdAt: '2026-09-13T08:00:00Z', targetPath: '/businesses/5/reviews?reviewId=12' };

assert.equal(notificationTarget(base), '/businesses/5/reviews?reviewId=12');
assert.equal(notificationTarget({ ...base, targetPath: null, type: 'CLAIM_SUBMITTED' }), '/admin/business-claims');
assert.equal(notificationTarget({ ...base, targetPath: null, type: 'REPORT_CREATED' }), '/admin/reports');
assert.equal(notificationTarget({ ...base, targetPath: null, type: 'NEW_REPLY' }), '/reviews/my');
for (const targetPath of ['https://example.com', '//example.com', '/\\example.com', 'javascript:alert(1)', '/ invalid']) {
  assert.equal(notificationTarget({ ...base, targetPath }), '/reviews/my');
}
for (const isRead of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(NotificationItem, { notification: { ...base, isRead } }));
  assert.match(html, /href="\/businesses\/5\/reviews\?reviewId=12"/);
  assert.doesNotMatch(html, /disabled=/);
  assert.ok(html.includes(`aria-label="${isRead ? 'Read' : 'Unread'}: New reply"`));
  assert.equal(html.includes('h-2 w-2 shrink-0 rounded-full bg-primary-600'), !isRead);
  assert.ok(html.includes(isRead ? 'bg-ink-50 hover:bg-ink-100' : 'bg-primary-100 hover:bg-primary-200'));
}
const dashboard = fs.readFileSync(new URL('../app/(admin)/admin/page.tsx', import.meta.url), 'utf8');
assert.ok(dashboard.includes('grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_1fr]'));
console.log('Notification destinations, read/unread rendering and dashboard alignment passed.');
