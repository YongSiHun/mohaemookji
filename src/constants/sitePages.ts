import { BRAND } from './brand.ts';

export const SITE_PAGES = [
  { path: '/', title: BRAND.title, description: BRAND.description },
  {
    path: '/about/',
    title: '서비스 소개 | 모해묵지',
    description:
      '맛과 재료로 오늘의 메뉴를 고르고 YouTube에서 조리법을 찾아보는 방법을 안내합니다.',
  },
  {
    path: '/privacy/',
    title: '개인정보처리방침 및 쿠키 안내 | 모해묵지',
    description: '검색 정보, 접속 정보, 광고 쿠키와 외부 서비스 이용에 관한 안내입니다.',
  },
  {
    path: '/terms/',
    title: '이용약관 | 모해묵지',
    description: '메뉴 추천 정보의 범위와 한계, 외부 서비스 및 콘텐츠 이용에 관한 안내입니다.',
  },
] as const;
