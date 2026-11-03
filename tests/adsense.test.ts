import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { transformWithEsbuild } from 'vite';
import { mayRequestAds } from '../src/services/adConsent.ts';
import { isRecipeIndex } from '../src/services/recipeValidation.ts';
import { validateSources } from '../scripts/validate-recipes.ts';

const consent = {
  gdprApplies: true,
  eventStatus: 'tcloaded',
  cmpStatus: 'loaded',
  tcString: 'test-only',
  purpose: { consents: { '1': true } },
  vendor: { consents: { '755': true } },
};
test('동의 미확인·대기·오류·거부 시 광고 요청을 보류한다', () => {
  assert.equal(mayRequestAds(consent, true), true);
  for (const value of [
    null,
    undefined,
    {},
    { ...consent, gdprApplies: undefined },
    { ...consent, eventStatus: 'cmpuishown' },
    { ...consent, cmpStatus: 'error' },
    { ...consent, tcString: '' },
    { ...consent, purpose: { consents: {} } },
    { ...consent, vendor: { consents: {} } },
  ])
    assert.equal(mayRequestAds(value, true), false);
  assert.equal(mayRequestAds(consent, false), false);
  assert.equal(mayRequestAds({ ...consent, gdprApplies: false }, true), true);
});

async function adHarness(production: boolean, pathname = '/', search = '') {
  const source = (await readFile(new URL('../src/ads.ts', import.meta.url), 'utf8'))
    .replace(/import .*?from .*?;\n/g, '')
    .replaceAll('import.meta.env.PROD', String(production));
  const { code } = await transformWithEsbuild(source, 'ads.ts', { loader: 'ts', target: 'es2022' });
  const scripts: Record<string, unknown>[] = [];
  const events: Record<string, () => void> = {};
  let callback: ((value: unknown, success: boolean) => void) | undefined;
  let reloads = 0;
  const document = {
    documentElement: { dataset: { adsContentReady: 'false' } },
    head: {
      append(script: Record<string, unknown>) {
        scripts.push(script);
      },
    },
    createElement() {
      return { dataset: {} };
    },
    querySelector(selector: string) {
      return selector === 'script[nonce]' ? { nonce: 'test-nonce' } : scripts[0];
    },
  };
  const window = {
    addEventListener(name: string, fn: () => void) {
      events[name] = fn;
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    __tcfapi(_command: string, _version: number, fn: typeof callback) {
      callback = fn;
    },
  };
  runInNewContext(code, {
    window,
    document,
    location: {
      pathname,
      search,
      reload() {
        reloads++;
      },
    },
    mayRequestAds,
  });
  return {
    scripts,
    document,
    events,
    consent(value: unknown, success = true) {
      callback?.(value, success);
    },
    reloads: () => reloads,
  };
}

test('프로덕션은 콘텐츠·동의 후 head에 정확히 한 번 삽입하고 실패해도 예외를 전파하지 않는다', async () => {
  const h = await adHarness(true);
  h.consent(consent);
  assert.equal(h.scripts.length, 0);
  h.document.documentElement.dataset.adsContentReady = 'true';
  h.events['ads-content-ready']();
  h.events['ads-content-ready']();
  h.consent(consent);
  assert.equal(h.scripts.length, 1);
  assert.equal(
    h.scripts[0].src,
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7225723390864149',
  );
  assert.equal(h.scripts[0].async, true);
  assert.equal(h.scripts[0].crossOrigin, 'anonymous');
  assert.equal(h.scripts[0].nonce, 'test-nonce');
  assert.doesNotThrow(() => (h.scripts[0].onerror as () => void)());
  h.consent(null, false);
  assert.equal(h.reloads(), 0);
  h.consent({ ...consent, eventStatus: 'cmpuishown' });
  assert.equal(h.reloads(), 0);
  h.consent({ ...consent, vendor: { consents: {} } });
  assert.equal(h.reloads(), 1);
});

test('개발·안내·검색 쿼리 페이지에는 동의가 있어도 광고를 삽입하지 않는다', async () => {
  for (const [prod, path, search] of [
    [false, '/', ''],
    [true, '/privacy/', ''],
    [true, '/terms/', ''],
    [true, '/about/', ''],
    [true, '/', '?q=tofu'],
    [true, '/missing', ''],
  ] as const) {
    const h = await adHarness(prod, path, search);
    h.document.documentElement.dataset.adsContentReady = 'true';
    h.consent(consent);
    h.events['ads-content-ready']?.();
    assert.equal(h.scripts.length, 0);
  }
});

test('선택적 설명은 원본 검증부터 인덱스까지 보존하고 잘못된 타입은 거부한다', () => {
  const recipe = {
    id: 'example',
    name: '예시',
    flavors: ['spicy'],
    ingredients: ['두부'],
    seasonings: ['소금'],
    description: '대표 재료를 비교해보세요.',
  };
  const source = (raw: unknown) => ({
    cuisine: 'korean',
    categories: { tofu: { name: '두부', recipes: [raw] } },
  });
  const parsed = validateSources([source(recipe)], ['spicy']);
  assert.equal(parsed[0].description, recipe.description);
  assert.equal(parsed[0].category, '두부');
  assert.equal(isRecipeIndex(parsed, 1), true);
  for (const invalid of ['', 123, '<'.repeat(257)]) {
    assert.throws(() => validateSources([source({ ...recipe, description: invalid })], ['spicy']));
    assert.equal(isRecipeIndex([{ ...parsed[0], description: invalid }], 1), false);
  }
});
