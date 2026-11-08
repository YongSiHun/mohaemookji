/** 정적 자산: 동일 origin · HTML: 요청별 CSP nonce */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GOOGLE_CMP_SCRIPT_URL?: string;
}
interface ScriptElement {
  setAttribute(name: string, value: string): void;
  append(content: string, options: { html: boolean }): void;
}
declare const HTMLRewriter: {
  new (): {
    on(
      selector: string,
      handler: { element(element: ScriptElement): void },
    ): InstanceType<typeof HTMLRewriter>;
    transform(response: Response): Response;
  };
};

/** Google 발급 CMP 스크립트 URL만 연결 */
function cmpTag(value: string | undefined, nonce: string): string {
  const missing = !value;
  if (missing) return '';
  const url = new URL(value);
  const valid =
    url.protocol === 'https:' &&
    url.hostname === 'fundingchoicesmessages.google.com' &&
    !url.username &&
    !url.password &&
    url.pathname.startsWith('/i/pub-7225723390864149');
  const invalid = !valid;
  if (invalid) throw new Error('GOOGLE_CMP_SCRIPT_URL이 올바르지 않습니다.');
  return (
    '<script async nonce="' +
    nonce +
    '" src="' +
    url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;') +
    '"></script>'
  );
}

/** prod HTTP → HTTPS 리디렉션 · 로컬 제외 */
function shouldRedirectToHttps(url: URL): boolean {
  const local =
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname === '[::1]' ||
    /^127\.\d+\.\d+\.\d+$/.test(url.hostname);
  return url.protocol === 'http:' && !local;
}

function htmlHeaders(asset: Response, url: URL, nonce: string): Headers {
  const headers = new Headers(asset.headers);
  // HTTP 강제 업그레이드 시 module JS·fetch origin 불일치 가능
  // HTTPS 문서에만 혼합 콘텐츠 차단 적용
  headers.set(
    'Content-Security-Policy',
    "object-src 'none'; base-uri 'none'; script-src 'nonce-" +
      nonce +
      "' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https: http:; frame-ancestors 'none'; form-action 'self'" +
      (url.protocol === 'https:' ? '; upgrade-insecure-requests' : ''),
  );
  headers.set('Cache-Control', 'no-store');
  headers.delete('etag');
  headers.delete('content-length');

  const queryPage = url.search.length > 0;
  if (queryPage) headers.set('X-Robots-Tag', 'noindex, follow');
  return headers;
}
function getCmpTag(asset: Response, url: URL, env: Env, nonce: string): string {
  const knownPage = ['/', '/about/', '/privacy/', '/terms/'].includes(url.pathname);
  const canLoadCmp = asset.status === 200 && knownPage;
  const skip = !canLoadCmp;
  if (skip) return '';
  try {
    return cmpTag(env.GOOGLE_CMP_SCRIPT_URL, nonce);
  } catch {
    return '';
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const redirectToHttps = shouldRedirectToHttps(url);
    if (redirectToHttps) {
      url.protocol = 'https:';
      return Response.redirect(url.href, 308);
    }
    const asset = await env.ASSETS.fetch(request);
    const html = asset.headers.get('content-type')?.includes('text/html');
    const notHtml = !html;
    if (notHtml) return asset;
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
    const headers = htmlHeaders(asset, url, nonce);
    const cmp = getCmpTag(asset, url, env, nonce);
    return new HTMLRewriter()
      .on('script', {
        element(element) {
          element.setAttribute('nonce', nonce);
        },
      })
      .on('head', {
        element(element) {
          element.append(cmp, { html: true });
        },
      })
      .transform(
        new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers }),
      );
  },
};
