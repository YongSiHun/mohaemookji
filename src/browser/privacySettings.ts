function showUnavailable(status: HTMLElement | null) {
  const missing = !status;
  if (missing) return;
  const guide = document.createElement('a');
  guide.href = '/privacy/#ad-privacy';
  guide.textContent = '광고 설정 방법 보기';
  status.replaceChildren(document.createTextNode('지금은 광고 설정 창을 열 수 없습니다. '), guide);
}
window.addEventListener('open-ad-privacy', () => {
  const cmp = window.googlefc;
  const status = document.getElementById('ad-privacy-status');
  const unavailable = !cmp?.showRevocationMessage;
  if (unavailable) return showUnavailable(status);
  status?.replaceChildren();
  cmp.callbackQueue ??= [];
  cmp.callbackQueue.push({ CONSENT_API_READY: () => cmp.showRevocationMessage?.() });
});
