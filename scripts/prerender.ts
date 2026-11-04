import { createServer, loadEnv } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SITE_PAGES } from '../src/constants/sitePages.ts';
import {
  getRecipePath,
  getRecipeMetadata,
  getRecipeStructuredData,
  serializeStructuredData,
} from '../src/services/recipeDetails.ts';
import type { Recipe } from '../src/types/recipe.ts';

const env = loadEnv(process.env.BUILD_MODE ?? 'production', process.cwd(), '');
const configured = env.SITE_URL;
let origin = '';
if (configured) {
  const url = new URL(configured);
  const invalid =
    url.protocol !== 'https:' ||
    url.pathname !== '/' ||
    Boolean(url.search || url.hash || url.username || url.password);
  if (invalid) throw new Error('SITE_URL은 경로·쿼리·인증 정보 없는 HTTPS origin이어야 합니다.');
  origin = url.origin;
}
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
// 이미지 내용이 바뀌면 새 URL로 발행해 공유 서비스의 이미지 캐시를 갱신한다.
const preview = await readFile('public/social-preview.jpg');
const previewHash = createHash('sha256').update(preview).digest('hex').slice(0, 12);
const previewPath = '/social-preview-' + previewHash + '.jpg';
await writeFile('dist' + previewPath, preview);
const template = (await readFile('dist/index.html', 'utf8'))
  .replace(/<link rel="canonical"[^>]*>/g, '')
  .replace(/<meta property="og:url"[^>]*>/g, '')
  .replaceAll('content="/social-preview.jpg"', 'content="' + escape(origin + previewPath) + '"');
const withBody = (html: string, body: string) =>
  html.replace(
    /<!--app-start-->[\s\S]*?<!--app-end-->/,
    () => '<!--app-start--><div id="root">' + body + '</div><!--app-end-->',
  );
const recipes = JSON.parse(await readFile('public/data/recipe_index.json', 'utf8')) as Recipe[];
const recipePages = recipes.map(getRecipeMetadata);
const recipeByPath = new Map(recipes.map((recipe) => [getRecipePath(recipe), recipe]));
const indexablePages = [
  ...SITE_PAGES,
  ...recipes.filter((recipe) => recipe.content).map(getRecipeMetadata),
];
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
});
try {
  const { Information } = await server.ssrLoadModule('/src/pages/Information.tsx');
  const { RecipeDetail } = await server.ssrLoadModule('/src/pages/RecipeDetail.tsx');
  const { StaticHome } = await server.ssrLoadModule('/src/pages/StaticHome.tsx');
  async function renderPage(page: { path: string; title: string; description: string }) {
    const home = page.path === '/';
    const recipe = recipeByPath.get(page.path);
    const body = recipe
      ? renderToStaticMarkup(createElement(RecipeDetail, { recipe, recipes }))
      : home
        ? renderToStaticMarkup(
            createElement(StaticHome, { recipes: recipes.filter((r) => r.content).slice(0, 6) }),
          )
        : renderToStaticMarkup(createElement(Information, { path: page.path }));
    let html = withBody(template, body)
      .replace(/<title>.*?<\/title>/, '<title>' + escape(page.title) + '</title>')
      .replace(
        /(<meta (?:name="description"|property="og:description") content=")[^"]*("\s*\/?>)/g,
        '$1' + escape(page.description) + '$2',
      )
      .replace(
        /(<meta property="og:title" content=")[^"]*("\s*\/?>)/,
        '$1' + escape(page.title) + '$2',
      );
    const summaryOnly = recipe && !recipe.content;
    if (summaryOnly)
      html = html.replace('</head>', '<meta name="robots" content="noindex, follow" /></head>');
    const structured = recipe ? getRecipeStructuredData(recipe, origin) : undefined;
    if (structured)
      html = html.replace(
        '</head>',
        '<script type="application/ld+json">' +
          serializeStructuredData(structured) +
          '</script></head>',
      );
    const informationPage = !home;
    if (informationPage)
      html = html.replace(/<script\b(?=[^>]*data-ads-loader)[^>]*><\/script>/g, '');
    if (origin)
      html = html.replace(
        '</head>',
        '<link rel="canonical" href="' +
          escape(origin + page.path) +
          '" /><meta property="og:url" content="' +
          escape(origin + page.path) +
          '" /></head>',
      );
    await mkdir('dist' + page.path, { recursive: true });
    await writeFile('dist' + page.path + 'index.html', html);
  }
  for (const page of [...SITE_PAGES, ...recipePages]) await renderPage(page);
  const notFound = renderToStaticMarkup(createElement(Information, { path: '/404/' }));
  await writeFile(
    'dist/404.html',
    withBody(template, notFound)
      .replace(/<title>.*?<\/title>/, '<title>페이지를 찾을 수 없어요 | 모해묵지</title>')
      .replace('</head>', '<meta name="robots" content="noindex" /></head>')
      .replace(/<script\b(?=[^>]*data-ads-loader)[^>]*><\/script>/g, ''),
  );
} finally {
  await server.close();
}
if (origin) {
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    indexablePages.map((p) => '<url><loc>' + escape(origin + p.path) + '</loc></url>').join('') +
    '</urlset>';
  await writeFile('dist/sitemap.xml', sitemap);
  await writeFile(
    'dist/robots.txt',
    (await readFile('public/robots.txt', 'utf8')) + 'Sitemap: ' + origin + '/sitemap.xml\n',
  );
} else {
  await rm('dist/sitemap.xml', { force: true });
  await writeFile('dist/robots.txt', await readFile('public/robots.txt', 'utf8'));
  console.warn('SITE_URL 미설정: canonical·og:url·sitemap 생성을 보류합니다.');
}
console.log(
  '안내 페이지 4개 · 요리 상세 ' +
    recipes.length +
    '개 · 조리 콘텐츠 ' +
    recipes.filter((r) => r.content).length +
    '개 · 404 페이지 생성 완료',
);
