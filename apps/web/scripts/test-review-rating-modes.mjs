import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require.extensions['.tsx'] = require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
};
const Module = require('node:module');
const originalLoad = Module._load;
const React = require('react');
let state = [], cursor = 0;
let query = { data: [{ criterionId: 1, name: 'Quality' }, { criterionId: 2, name: 'Service' }], isLoading: false, isError: false, refetch() {} };
const component = name => Object.assign(() => null, { displayName: name });
const Button = component('Button'), StarRating = component('StarRating'), CriteriaRatingInput = component('CriteriaRatingInput');
Module._load = function(id, ...args) {
  if (id === 'react') return { ...React, useRef: () => ({ current: null }), useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  } };
  if (id.endsWith('/use-business-criteria.query')) return { useBusinessCriteriaQuery: () => query };
  if (id.endsWith('/criteria-rating-input')) return { CriteriaRatingInput };
  if (id.endsWith('/star-rating')) return { StarRating };
  if (id === '@/components/ui/button') return { Button };
  if (id.startsWith('@/')) return originalLoad.call(this, path.resolve('app', id.slice(2)), ...args);
  return originalLoad.call(this, id, ...args);
};
const { WriteReviewForm } = require('../app/features/review/components/write-review-form.tsx');
const submissions = [];
const props = { businessId: 9, categoryIds: [1], onSubmit: async data => submissions.push(data) };
let tree;
const render = () => { cursor = 0; tree = WriteReviewForm(props); };
function nodes(node = tree) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(child => nodes(child))];
}
const find = predicate => nodes().find(predicate);
const mode = value => { find(n => n.type === 'input' && n.props.value === value).props.onChange(); render(); };
const submit = async () => { await tree.props.onSubmit({ preventDefault() {} }); render(); };
const submitButton = () => find(n => n.type === Button && n.props.type === 'submit');
render();
find(n => n.type === StarRating).props.onChange(4);
find(n => n.type === 'textarea').props.onChange({ target: { value: 'A good experience.' } });
render();
await submit();
assert.deepEqual(submissions.at(-1).criteriaRatings, []);
mode('criteria');
assert.equal(submitButton().props.disabled, true);
await submit();
assert.equal(submissions.length, 1);
find(n => n.type === CriteriaRatingInput).props.onChange(5); render();
assert.equal(submitButton().props.disabled, true);
find(n => n.type === CriteriaRatingInput && n.props.criterionName === 'Service').props.onChange(3); render();
assert.equal(Boolean(submitButton().props.disabled), false);
await submit();
assert.deepEqual(submissions.at(-1).criteriaRatings, [{ criterionId: 1, ratingValue: 5 }, { criterionId: 2, ratingValue: 3 }]);
mode('overall'); await submit();
assert.deepEqual(submissions.at(-1).criteriaRatings, []);
for (const unavailable of [{ data: undefined, isLoading: true }, { isError: true }, { data: [] }]) {
  const previous = query; query = { ...previous, ...unavailable };
  mode('criteria'); const count = submissions.length;
  assert.equal(submitButton().props.disabled, true); await submit(); assert.equal(submissions.length, count);
  mode('overall'); await submit(); assert.equal(submissions.length, count + 1);
  query = previous;
}
state = []; props.initialValues = { overallRating: 3, content: 'Existing review.', criteriaRatings: [{ criterionId: 1, ratingValue: 3 }] }; render();
assert.equal(find(n => n.type === 'input' && n.props.value === 'criteria').props.checked, true);
assert.equal(submitButton().props.disabled, true);
mode('overall'); await submit(); assert.deepEqual(submissions.at(-1).criteriaRatings, []);
Module._load = originalLoad;
console.log('Review form: overall-only, complete criteria, partial criteria, switching modes, unavailable criteria, and editing passed.');
