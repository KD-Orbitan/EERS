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

const { ProvinceSelect } = loadModule('../app/features/business/components/province-select.tsx');
const { VIETNAM_PROVINCES } = loadModule('../app/features/business/constants/provinces.ts');
assert.equal(VIETNAM_PROVINCES.length, 34);
assert.equal(new Set(VIETNAM_PROVINCES).size, 34);
const render = (props) => renderToStaticMarkup(React.createElement(ProvinceSelect, props));
const standard = render({ name: 'province', value: VIETNAM_PROVINCES[0], onChange() {} });
assert.equal((standard.match(/<option /g) ?? []).length, 35);
assert.ok(standard.includes('selected=""'));
assert.ok(standard.includes('name="province"'));
const legacy = render({ legacyValue: 'Old province', defaultValue: 'Old province' });
assert.ok(legacy.includes('value="Old province" selected=""'));
assert.equal((legacy.match(/<option /g) ?? []).length, 36);
assert.ok(render({ value: '', onChange() {}, placeholder: 'All provinces / cities' }).includes('value="" selected="">All provinces / cities'));
console.log('Province choices, selection, legacy values and clearing the filter passed.');
