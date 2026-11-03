/** 정적 자산은 그대로 제공하고 HTML에 요청별 CSP nonce를 적용한다. */
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

/** 운영자가 Google 관리 화면에서 받은 CMP 스크립트 URL만 연결 */
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const asset = await env.ASSETS.fetch(request);
    const html = asset.headers.get('content-type')?.includes('text/html');
    const notHtml = !html;
    if (notHtml) return asset;
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
    const headers = new Headers(asset.headers);
    headers.set(
      'Content-Security-Policy',
      "object-src 'none'; base-uri 'none'; script-src 'nonce-" +
        nonce +
        "' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https: http:; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
    );
    headers.set('Cache-Control', 'no-store');
    headers.delete('etag');
    headers.delete('content-length');
    const url = new URL(request.url);
    const queryPage = url.search.length > 0;
    if (queryPage) headers.set('X-Robots-Tag', 'noindex, follow');
    const knownPage = ['/', '/about/', '/privacy/', '/terms/'].includes(url.pathname);
    const canLoadCmp = asset.status === 200 && knownPage;
    let cmp = '';
    try {
      cmp = canLoadCmp ? cmpTag(env.GOOGLE_CMP_SCRIPT_URL, nonce) : '';
    } catch {
      /* CMP 설정 오류는 광고만 보류하고 서비스를 계속 제공한다. */
    }
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
