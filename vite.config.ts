import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { recipeDataPlugin } from './scripts/recipe-data-plugin';
import { BRAND } from './src/constants/brand';
export default defineConfig(({ command, mode }) => ({
  plugins: [
    recipeDataPlugin(),
    react(),
    tailwindcss(),
    {
      name: 'brand-meta',
      /** 브랜드 메타 반영 */
      transformIndexHtml: {
        order: 'pre',
        handler: (html) =>
          html
            .replaceAll('%BRAND_TITLE%', BRAND.title)
            .replaceAll('%BRAND_DESCRIPTION%', BRAND.description)
            .replaceAll('%BRAND_NAME%', BRAND.name)
            .replace(
              '%ADSENSE_HEAD%',
              command === 'build' && mode === 'production'
                ? '<script type="module" src="/src/ads.ts" data-ads-loader></script>'
                : '',
            ),
      },
    },
  ],
}));
