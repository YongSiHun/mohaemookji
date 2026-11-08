import { mayRequestAds } from './services/adConsent';
import type { ConsentData } from './services/adConsent';

type TcfApi = (
  command: string,
  version: number,
  callback: (data: ConsentData | null | undefined, success: boolean) => void,
) => void;
declare global {
  interface Window {
    __tcfapi?: TcfApi;
    googlefc?: { showRevocationMessage?: () => void; callbackQueue?: Record<string, () => void>[] };
  }
}

const AD_URL =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7225723390864149';
let allowed = false;
let subscribed = false;
let loaded = false;

/** 앱과 별도 로드 · 동의·콘텐츠 준비 후 head에 광고 1회 삽입 */
function loadAdSense() {
  const ready = document.documentElement.dataset.adsContentReady === 'true';
  const skip =
    !import.meta.env.PROD ||
    location.pathname !== '/' ||
    location.search !== '' ||
    !allowed ||
    !ready ||
    loaded;
  if (skip) return;
  const existing = document.querySelector(
    'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
  );
  loaded = true;
  if (existing) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = AD_URL;
  script.crossOrigin = 'anonymous';
  // strict-dynamic 허용 스크립트에도 nonce 전달
  script.nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ?? '';
  script.onerror = () => {
    script.dataset.loadFailed = 'true';
  };
  document.head.append(script);
}

/** 인증 CMP TCF 구독 · 미연결·오류 시 광고 보류 */
function subscribe(): boolean {
  const api = window.__tcfapi;
  const unavailable = !api || subscribed;
  if (unavailable) return subscribed;
  subscribed = true;
  try {
    api('addEventListener', 2, (data, success) => {
      allowed = mayRequestAds(data, success);
      const eventStatus = data?.eventStatus;
      const settled = eventStatus === 'tcloaded' || eventStatus === 'useractioncomplete';
      const decided = success && data?.cmpStatus === 'loaded' && settled;
      const revoked = decided && !allowed && loaded;
      if (revoked) {
        location.reload();
        return;
      }
      loadAdSense();
    });
  } catch {
    subscribed = false;
  }
  return subscribed;
}

/** 안내·오류·쿼리 URL: 광고 동의 대기 제외 */
function start() {
  const eligible = import.meta.env.PROD && location.pathname === '/' && location.search === '';
  const skip = !eligible;
  if (skip) return;
  window.googlefc = window.googlefc ?? {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue ?? [];
  window.googlefc.callbackQueue.push({
    CONSENT_API_READY: () => {
      subscribe();
      loadAdSense();
    },
  });
  window.addEventListener('ads-content-ready', loadAdSense);
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const done = subscribe() || attempts >= 120;
    if (done) window.clearInterval(timer);
  }, 500);
  subscribe();
  loadAdSense();
}
start();
