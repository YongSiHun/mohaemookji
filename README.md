# 모해묵지

맛·재료 기반 메뉴 검색 → YouTube 레시피 연결.

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
