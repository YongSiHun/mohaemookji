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

런타임 광고 동의 설정이 필요하면 Cloudflare Worker 환경 변수 `GOOGLE_CMP_SCRIPT_URL`에 Google 관리 화면에서 발급된 CMP 태그의 HTTPS src를 설정합니다. 로컬 Worker 실행은 `.dev.vars`를 사용합니다. 미설정 시 광고 요청을 보류합니다.

## 코드 구조

화면(`components`·`pages`·`hooks`) → 서비스(`services`) → 데이터 접근(`repositories`)의 3계층으로 구성합니다. 서비스는 UI를 참조하지 않고, 저장소는 상위 계층을 참조하지 않습니다. 공통 타입·순수 유틸리티·상수는 `types`·`utils`·`constants`에서 공유합니다. 브라우저 DOM 부수효과는 `browser`와 진입점에서 처리합니다.

- HTTP 요청과 JSON 응답 해석은 저장소가, 데이터 검증·복구·동시 요청 캐시는 로딩 서비스가 담당합니다. `createRecipeService(repository)`로 다른 저장소를 주입할 수 있습니다.
- 검색 순위와 키보드 동작은 규칙 목록으로 확장합니다. 화면은 검색·검증 정책을 직접 구현하지 않습니다.
- 앱·빌드·검사 코드에 함수별 인지복잡도 5 이하, 중첩 if·반복문 금지, 계층 간 import 규칙을 ESLint로 적용합니다. `scripts/eslint-rules.js`의 로컬 지표는 제어 흐름의 중첩, else, 연속 논리 연산자의 변경, 라벨 점프를 계산하며 내부 함수는 독립 측정합니다. 테스트 코드는 동작 시나리오 중심으로 작성합니다.
- 검색 인덱스와 자동완성 인덱스는 읽기 전용으로 재사용하고 데이터 갱신 시 새 배열로 교체합니다.

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

## 요리 데이터

원본은 `data/recipes/*.json`에 요리권역 → 첫 번째 주재료 → 요리 목록 구조로 저장합니다. 총 2,100개이며 ID는 전역 고유 값입니다. 기존 ID를 유지하고, 같은 메뉴의 표기·별칭·제공자·그릇 차이로 항목을 늘리지 않습니다. 생소한 요리명에는 검색 가능한 한글 설명을 붙입니다.

재료·양념은 메뉴 탐색용 대표 구성으로, 전체 조리법이 아닙니다. 맛 태그와 `flavorLevels`는 재료 조합에 따른 편집 추정치이며 실측·시식 결과가 아닙니다. 지역·가정별 양념 분량과 조리법에 따라 실제 맛은 달라집니다. 외부 레시피 본문·사진·데이터셋을 복사·재배포하지 않았습니다.

`flavorLevels`는 등록한 맛 ID별 1~5 정수입니다. 예: `"flavorLevels": { "spicy": 3, "umami": 4 }`. 별은 평점이 아니라 예상 강도이며, 1은 은은함, 3은 보통, 5는 매우 강함입니다. 태그가 없는 맛은 0점이 아니라 미등록입니다. 현재 모든 원본 메뉴에 강도를 입력했으며, 검토 후 JSON에서 직접 수정합니다. 런타임은 저장된 값을 표시합니다.

수정 후 `yarn build`로 구조·중복 ID·맛 태그·강도 키와 범위를 검증하고 검색 인덱스와 SHA-256 버전을 생성합니다. 개발 서버에서는 JSON 변경을 자동 반영합니다.

요리명·권역 검토에 참고한 공개 자료(전 항목의 개별 출처 목록은 아닙니다):

- [일본 농림수산성 향토요리](https://www.maff.go.jp/e/policies/market/k_ryouri/index.html)
- [베트남 관광청 요리 소개](https://vietnam.travel/node/195)
- [인도 관광청 음식 문화](https://www.incredibleindia.gov.in/)
- [싱가포르 국가유산청 칠리크랩](https://www.roots.gov.sg/ich-landing/ich/chilli-crab)
- [스페인 관광청 전통 음식](https://www.spain.info/en/discover-spain/dishes-traditional-cuisine-spain/)
- [포르투갈 관광청 음식 문화](https://www.visitportugal.com/en/experiencias/gastronomia-e-vinhos)
