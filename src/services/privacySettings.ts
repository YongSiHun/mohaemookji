window.addEventListener('open-ad-privacy', () => {
  const cmp = window.googlefc;
  const status = document.getElementById('ad-privacy-status');
  const available = cmp?.showRevocationMessage;
  if (available) {
    cmp.callbackQueue = cmp.callbackQueue ?? [];
    cmp.callbackQueue.push({ CONSENT_API_READY: () => cmp.showRevocationMessage?.() });
    return;
  }
  if (status)
    status.textContent =
      '동의 관리 도구가 연결되지 않았거나 로딩되지 않았습니다. 개인정보·쿠키 안내에서 문의 방법을 확인하세요.';
});
