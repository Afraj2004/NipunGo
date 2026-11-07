const test = require('node:test');
const assert = require('node:assert');
const { normalizeQuery, cacheKey, isCacheable } = require('../utils/chatText');

test('equivalent questions share one cache key', () => {
  const a = cacheKey(normalizeQuery('Pipe LEAK ho raha hai!!'));
  const b = cacheKey(normalizeQuery('  pipe leak   ho raha hai '));
  assert.strictEqual(a, b);
});

test('different questions get different keys', () => {
  assert.notStrictEqual(
    cacheKey(normalizeQuery('pipe leak')),
    cacheKey(normalizeQuery('ac leak'))
  );
});

test('only short standalone questions are cacheable', () => {
  assert.strictEqual(isCacheable(normalizeQuery('hi')), false);
  assert.strictEqual(isCacheable(normalizeQuery('ac thanda nahi kar raha')), true);
  assert.strictEqual(isCacheable('x'.repeat(201)), false);
});
