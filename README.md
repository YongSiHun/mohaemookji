# 모해묵지

맛과 재료로 메뉴를 찾고 유튜브 레시피로 연결하는 웹 서비스입니다.

Node.js 22.12+ · Yarn 1.22.22

```sh
yarn install
yarn start      # 개발 서버 · 핫 리로드
yarn build      # 데이터 생성 · 타입 검사 · 배포 빌드
yarn lint:fix   # 코드 검사 및 자동 수정
```

http://localhost:5173 · 요리 JSON 변경도 자동 반영됩니다.

폰트: 상단 로고 ‘모해묵지’와 메인 제목 ‘오늘 뭐해 먹지?’만 [카페24 써라운드](https://fonts.cafe24.com), 나머지 모든 글자는 [Pretendard](https://github.com/orioncactus/pretendard). 폰트 로딩 실패 시 시스템 글꼴로 대체됩니다.

## 자동 배포

GitHub `main` 푸시 시 lint → 빌드 → 테스트를 통과하면 Cloudflare Workers에 배포합니다. Actions에서 수동 실행도 가능합니다.

[GitHub Actions Secrets](https://github.com/YongSiHun/mohaemookji/settings/secrets/actions)에 아래 두 값을 등록하세요.

- `CLOUDFLARE_API_TOKEN`: Cloudflare의 **Edit Cloudflare Workers** 템플릿으로 만든 해당 계정용 API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: 배포할 Cloudflare 계정 ID

워크플로: `.github/workflows/deploy.yml` · 정적 자산: `dist` · Worker 이름: `mohaemookji`
