# 모해묵지

## 개요

- 맛·재료 기반 메뉴 검색 → YouTube 레시피 연결
- 메뉴 2,450종 · 맛·강도·검색어 AND 필터

## 기술스택

| 구분   | 스택                                        |
| ------ | ------------------------------------------- |
| FE     | React 19 · TS 5.9 · Vite 7 · Tailwind CSS 4 |
| 배포   | CF Workers                                  |
| 런타임 | Node.js 22.12+ · Yarn 1.22.22               |
| QA     | ESLint · Prettier · Husky · Node Test       |

## 명령어

| 명령어                        | 용도                  |
| ----------------------------- | --------------------- |
| `yarn install`                | 의존성 설치·Hook 등록 |
| `yarn start`                  | dev 서버              |
| `yarn build`                  | 데이터 검증·prod 빌드 |
| `yarn lint`                   | lint 검사             |
| `yarn lint:fix`               | lint 자동 수정        |
| `yarn format`                 | 포맷 적용             |
| `yarn format:check`           | 포맷 검사             |
| `yarn typecheck`              | TS 검사               |
| `yarn test`                   | 기능 테스트           |
| `yarn check`                  | lint·포맷·TS 검사     |
| `yarn prepare`                | Hook 등록             |
| `yarn audit --level moderate` | 의존성 취약점 검사    |
| `yarn wrangler deploy`        | CF 배포               |

## 요리 데이터 출처

- 원본: `data/recipes/*.json` · 자체 편집
- 재료·양념: 대표 구성 · 맛 강도: 편집 추정값
- 외부 본문·사진·데이터셋 복제·재배포 없음
- 아래 자료: 요리명·권역 검토 참고용 · 개별 메뉴별 출처 목록 아님

| 기관                | 참고 자료                                                                               |
| ------------------- | --------------------------------------------------------------------------------------- |
| 일본 농림수산성     | [향토요리](https://www.maff.go.jp/e/policies/market/k_ryouri/index.html)                |
| 베트남 관광청       | [요리 소개](https://vietnam.travel/node/195)                                            |
| 인도 관광청         | [음식 문화](https://www.incredibleindia.gov.in/)                                        |
| 싱가포르 국가유산청 | [칠리크랩](https://www.roots.gov.sg/ich-landing/ich/chilli-crab)                        |
| 스페인 관광청       | [전통 음식](https://www.spain.info/en/discover-spain/dishes-traditional-cuisine-spain/) |
| 포르투갈 관광청     | [음식 문화](https://www.visitportugal.com/en/experiencias/gastronomia-e-vinhos)         |
