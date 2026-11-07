export interface ConsentData {
  gdprApplies?: boolean;
  eventStatus?: string;
  cmpStatus?: string;
  tcString?: string;
  purpose?: { consents?: Record<string, boolean> };
  vendor?: { consents?: Record<string, boolean> };
}

function hasGoogleStorageConsent(data: ConsentData): boolean {
  return (
    Boolean(data.tcString) &&
    data.purpose?.consents?.['1'] === true &&
    data.vendor?.consents?.['755'] === true
  );
}

function isSettled(data: ConsentData, success: boolean): boolean {
  const settled = data.eventStatus === 'tcloaded' || data.eventStatus === 'useractioncomplete';
  return success && data.cmpStatus === 'loaded' && settled;
}

/** 동의 미확인·오류·거부 시 요청 보류. 개별 광고 목적은 Google에서도 판단. */
export function mayRequestAds(data: ConsentData | null | undefined, success: boolean): boolean {
  const missing = !data;
  if (missing) return false;
  const invalid = !isSettled(data, success);
  if (invalid) return false;
  const outsideGdpr = data.gdprApplies === false;
  if (outsideGdpr) return true;
  return data.gdprApplies === true && hasGoogleStorageConsent(data);
}
