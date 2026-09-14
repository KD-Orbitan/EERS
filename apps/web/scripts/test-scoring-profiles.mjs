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

const { SCORING_PROFILES, matchingScoringProfile } = loadModule('../app/features/admin/constants/scoring-profiles.ts');
const { scoringConfigSchema } = loadModule('../app/features/admin/schemas/scoring-config.schema.ts');
for (const profile of SCORING_PROFILES) {
  const parsed = scoringConfigSchema.parse(profile.values);
  assert.equal(Object.keys(parsed).length, 21, 'A profile must fill every scoring parameter');
  assert.equal(matchingScoringProfile(parsed)?.id, profile.id);
  assert.equal(matchingScoringProfile({ ...parsed, bayesianM: parsed.bayesianM + 1 }), undefined);
  assert.equal(matchingScoringProfile({ ...parsed, bayesianM: NaN }), undefined);
  const draft = { ...profile.values };
  draft.bayesianM += 1;
  assert.notEqual(draft.bayesianM, profile.values.bayesianM, 'Fine-tuning must not modify presets');
}
const [low, medium, high] = SCORING_PROFILES.map(p => p.values);
assert.ok(low.thetaDup > medium.thetaDup && medium.thetaDup > high.thetaDup);
assert.ok(low.thetaSpam > medium.thetaSpam && medium.thetaSpam > high.thetaSpam);
assert.ok(low.thetaSus > medium.thetaSus && medium.thetaSus > high.thetaSus);
assert.ok(low.thetaReject > medium.thetaReject && medium.thetaReject > high.thetaReject);
assert.ok(low.suspiciousDelta > medium.suspiciousDelta && medium.suspiciousDelta > high.suspiciousDelta);
assert.ok(low.bayesianM < medium.bayesianM && medium.bayesianM < high.bayesianM);
assert.equal(scoringConfigSchema.safeParse({ ...medium, trustAlpha: 0.9 }).success, false);
assert.equal(scoringConfigSchema.safeParse({ ...medium, thetaSus: 0.9 }).success, false);
// Resolve app aliases while rendering the real form with React Hook Form.
const Module = loadModule('node:module');
const path = loadModule('node:path');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@/')) request = path.resolve('app', request.slice(2));
  return originalResolve.call(this, request, ...args);
};
const { ScoringConfigForm } = loadModule('../app/features/admin/components/scoring-config-form.tsx');
for (const [config, label] of [[medium, 'Medium'], [{ ...medium, bayesianM: 13 }, 'Custom']]) {
  const html = renderToStaticMarkup(React.createElement(ScoringConfigForm, { config, onSubmit() { throw new Error('Must not auto-save'); } }));
  assert.ok(html.includes('Current form: ' + label));
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, label === 'Custom' ? 0 : 1);
  assert.ok(html.includes('Advanced settings'));
  assert.ok(html.includes('Restore saved configuration'));
}
console.log('All profiles valid and complete; strictness ordering, custom detection, fine-tuning isolation, validation and real form rendering passed.');
