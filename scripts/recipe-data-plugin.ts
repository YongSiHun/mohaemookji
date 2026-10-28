import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_DATA_DIRECTORY } from './constants.ts';
import type { Plugin } from 'vite';
import { buildRecipes } from './build-recipes.ts';

/** 데이터 갱신 플러그인 */
export function recipeDataPlugin(): Plugin {
  return {
    name: 'recipe-data-reload',
    apply: 'serve',

    /** 개발 서버 연결 */
    async configureServer(server) {
      await buildRecipes();
      let pending = Promise.resolve();

      /** 데이터 재생성 */
      const rebuild = (file: string) => {
        const normalized = relative(fileURLToPath(SOURCE_DATA_DIRECTORY), file).replaceAll(
          '\\',
          '/',
        );
        const shouldSkipFile =
          !(normalized.startsWith('recipes/') && normalized.endsWith('.json')) &&
          normalized !== 'flavors.json';
        if (shouldSkipFile) return;
        pending = pending
          .then(async () => {
            await buildRecipes();
            server.ws.send({ type: 'full-reload' });
          })
          .catch((cause: unknown) => {
            const error = cause instanceof Error ? cause : new Error(String(cause));
            server.config.logger.error(error.message);
            server.ws.send({
              type: 'error',
              err: { message: error.message, stack: error.stack ?? '' },
            });
          });
      };
      server.watcher.on('add', rebuild);
      server.watcher.on('change', rebuild);
      server.watcher.on('unlink', rebuild);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', rebuild);
        server.watcher.off('change', rebuild);
        server.watcher.off('unlink', rebuild);
      });
    },
  };
}
