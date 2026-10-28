import { BRAND } from '../constants/brand';

/** 상단 브랜드 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="#" aria-label={BRAND.name + ' 홈'}>
          <img src="/logo.svg" width="48" height="48" alt="" />
          <span>{BRAND.name}</span>
        </a>
      </div>
    </header>
  );
}

/** 하단 연락처 */
export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <a className="brand footer-brand" href="#">
        <img src="/logo.svg" width="27" height="27" alt="" />
        {BRAND.name}
      </a>
      <p>오늘도 맛있는 한 끼 하세요.</p>
      <div className="footer-details">
        <a href={'mailto:' + BRAND.contactEmail}>{BRAND.contactEmail}</a>
        <span>
          © {new Date().getFullYear()} {BRAND.englishName}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
