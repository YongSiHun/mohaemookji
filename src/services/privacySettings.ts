window.addEventListener('open-ad-privacy', () => {
  const cmp = window.googlefc;
  const status = document.getElementById('ad-privacy-status');
  const available = cmp?.showRevocationMessage;
  if (available) {
    if (status) status.replaceChildren();
    cmp.callbackQueue = cmp.callbackQueue ?? [];
    cmp.callbackQueue.push({ CONSENT_API_READY: () => cmp.showRevocationMessage?.() });
    return;
  }
  if (status) {
    const guide = document.createElement('a');
    guide.href = '/privacy/#ad-privacy';
    guide.textContent = '광고 설정 방법 보기';
    status.replaceChildren(
      document.createTextNode('지금은 광고 설정 창을 열 수 없습니다. '),
      guide,
    );
  }
});
