# 모해묵지

맛과 재료로 메뉴를 찾고 유튜브 레시피로 연결하는 정적 웹 서비스입니다.

## 실행

Node.js 22.12 이상 · Yarn 1.22.22

```sh
yarn install
yarn start
```

http://localhost:5173 · 코드와 요리 JSON 변경이 자동 반영됩니다.

## 검사 및 빌드

| 명령어 | 용도 |
| --- | --- |
| `yarn lint:fix` | 코드 검사 및 자동 수정 |
| `yarn build` | 데이터 검증·인덱스 생성·타입 검사·프로덕션 빌드 |

## 데이터 관리

- 원본: `src/data/recipes/*.json`
- 맛·별칭: `src/data/flavors.json`, `src/data/ingredient_aliases.json`
- 맛은 OR, 쉼표로 나눈 여러 검색어는 AND 조건으로 검색합니다.
- 데이터 작성 기준과 권역별 개수는 [요리 데이터 안내](src/data/recipes/README.md)를 참고하세요.

## 자동 배포

`main`에 푸시하면 GitHub Actions가 검사·빌드·테스트 후 Cloudflare Workers에 배포합니다.

[저장소 Secrets](https://github.com/YongSiHun/mohaemookji/settings/secrets/actions)에 한 번 등록하세요.

| 이름 | 값 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 배포 계정의 **Edit Cloudflare Workers** 권한 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | 배포할 Cloudflare 계정 ID |

설정: [워크플로](.github/workflows/deploy.yml) · [Wrangler](wrangler.jsonc) · 배포 대상: `dist`
