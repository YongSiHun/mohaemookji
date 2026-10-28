import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { recipeDataPlugin } from './scripts/recipe-data-plugin';
import { BRAND } from './src/config/brand';
export default defineConfig({ plugins: [recipeDataPlugin(), react(), tailwindcss(), { name: 'brand-meta', transformIndexHtml: html => html.replaceAll('%BRAND_TITLE%', BRAND.title).replaceAll('%BRAND_DESCRIPTION%', BRAND.description).replaceAll('%BRAND_NAME%', BRAND.name) }] });
