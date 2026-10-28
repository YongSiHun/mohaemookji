import type { Plugin } from 'vite';
import { buildRecipes } from './build-recipes.ts';

export function recipeDataPlugin(): Plugin {
  return {
    name: 'recipe-data-reload',
    apply: 'serve',
    async configureServer(server) {
      await buildRecipes();
      let pending = Promise.resolve();
      const rebuild = (file: string) => {
        const normalized = file.replaceAll('\\', '/');
        if (!normalized.includes('/src/data/recipes/') && !normalized.endsWith('/src/data/flavors.json')) return;
        pending = pending.then(async () => {
          await buildRecipes();
          server.ws.send({ type: 'full-reload' });
        }).catch((cause: unknown) => {
          const error = cause instanceof Error ? cause : new Error(String(cause));
          server.config.logger.error(error.message);
          server.ws.send({ type: 'error', err: { message: error.message, stack: error.stack ?? '' } });
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
