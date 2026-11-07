# 모해묵지

맛·재료 기반 메뉴 검색 > YouTube 레시피 연결.

## 검색 규칙

- 선택한 맛·맛 강도·검색어는 모두 AND로 결합합니다. 조건을 추가할수록 모두 만족하는 메뉴로 좁혀집니다.
- 강도 무관으로 선택해도 해당 맛은 모두 포함되어야 하며, 강도를 지정했다면 각 수치가 정확히 일치해야 합니다.
- 쉼표로 나눈 검색어는 각각 요리명·주재료·소스 중 한 곳에 부분 일치해야 합니다. 예: `두부, 간장`은 주재료의 두부와 소스의 진간장에도 일치합니다. 같은 검색어의 표기·별칭은 어느 하나가 일치하면 됩니다.
- 조건이 없으면 전체 메뉴를 표시합니다.

## 화면 지원

- 최소 지원 뷰포트 너비는 320px입니다. 높이는 고정하지 않고 세로 스크롤을 사용합니다.
- 600px 이하에서는 밥그릇 일러스트를 숨기고 검색 폼과 메뉴 카드를 한 열로 표시합니다.
- 320px 미만에서는 최소 레이아웃 너비를 유지하므로 가로 스크롤이 생길 수 있습니다.

## 디자인 기준

글씨 크기·굵기·간격·모바일 적용 기준은 [UI 디자인 컨벤션](docs/design-conventions.md)을 따릅니다. 공통 토큰은 `src/styles/design-system.css`에서 관리합니다.

## 스택

React 19 · TS 5.9 · Vite 7 · Tailwind CSS 4 · Cloudflare Workers
ESLint · Prettier · Husky · Node.js 22.12+ · Yarn 1.22.22

## 명령어

| 명령어                        | 용도                  |
| ----------------------------- | --------------------- |
| `yarn install`                | 의존성 설치·Hook 등록 |
| `yarn start`                  | 개발 서버             |
| `yarn build`                  | 데이터 검증·빌드      |
| `yarn lint`                   | 코드 검사             |
| `yarn lint:fix`               | 코드 자동 수정        |
| `yarn format`                 | 포맷 적용             |
| `yarn format:check`           | 포맷 검사             |
| `yarn typecheck`              | 타입 검사             |
| `yarn test`                   | 기능 테스트           |
| `yarn check`                  | lint·포맷·타입 검사   |
| `yarn prepare`                | Hook 등록             |
| `yarn audit --level moderate` | 의존성 취약점 검사    |
| `yarn wrangler deploy`        | Cloudflare 배포       |
