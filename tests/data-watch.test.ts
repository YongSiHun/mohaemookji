import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { recipeDataPlugin } from '../scripts/recipe-data-plugin.ts';
import { isRecord } from '../src/utils/validation.ts';

test('루트 data 원본 변경은 인덱스 재생성·전체 새로고침을 유발한다', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    plugins: [recipeDataPlugin()],
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    let reloadCount = 0;
    const reload = new Promise<void>((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error('data 변경 새로고침 없음')), 3000);
      server.ws.send = (payload: unknown) => {
        const isFullReload = isRecord(payload) && payload.type === 'full-reload';
        if (isFullReload) {
          reloadCount++;
          resolve();
        }
      };
    });
    server.watcher.emit(
      'change',
      fileURLToPath(new URL('../data/recipes/korean.json', import.meta.url)),
    );
    await reload;
    clearTimeout(timeout);
    assert.equal(reloadCount, 1);
    server.watcher.emit(
      'change',
      fileURLToPath(new URL('../public/data/recipe_index.json', import.meta.url)),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(reloadCount, 1);
  } finally {
    clearTimeout(timeout);
    await server.close();
  }
});
