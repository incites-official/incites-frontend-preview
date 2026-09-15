# INCITES Preview

백엔드 없이 고객에게 INCITES의 역할별 화면과 주요 흐름을 보여주는 Next.js 데모입니다. 데이터와 로그인 세션은 브라우저 `localStorage`에만 저장되며 외부 API를 호출하지 않습니다.

## 로컬 실행

```bash
npm ci
npm run dev
```

`http://localhost:3000`에서 모바일 로그인 화면을, `http://localhost:3000/admin/login`에서 관리자·선생님 로그인 화면을 확인할 수 있습니다. 로그인 화면의 데모 계정을 누르면 바로 로그인됩니다.

## 데모 계정

모든 계정의 비밀번호는 `incites1234`입니다.

| 권한 | 계정 1 | 계정 2 | 계정 3 |
| --- | --- | --- | --- |
| 관리자 | `admin1@incites.kr` | `admin2@incites.kr` | `admin3@incites.kr` |
| 선생님 | `teacher1@incites.kr` | `teacher2@incites.kr` | `teacher3@incites.kr` |
| 학생 | `student1@incites.kr` | `student2@incites.kr` | `student3@incites.kr` |
| 보호자 | `parent1@incites.kr` | `parent2@incites.kr` | `parent3@incites.kr` |

초기 데이터에는 선생님 3명과 학생 5명, 학생별 관찰 기록·역량·성장 리포트, 보호자 연결, 알림, 관리자 활동 로그가 포함되어 있습니다. 화면에서 수정한 내용은 같은 브라우저에서 새로고침해도 유지됩니다.

## Vercel 배포

Vercel에서 저장소를 가져온 뒤 프로젝트 이름을 `incites-preview`로 지정하면 기본 주소는 `https://incites-preview.vercel.app`이 됩니다. 별도 환경 변수나 백엔드 서비스는 필요하지 않습니다. 루트 디렉터리는 이 저장소의 루트로 지정합니다.

CLI를 사용하는 경우 Vercel에 로그인한 상태에서 다음과 같이 프로젝트를 연결하고 배포할 수 있습니다.

```bash
npx vercel link --yes --project incites-preview
npx vercel deploy
```

실제 백엔드 연동 모드가 다시 필요하면 `NEXT_PUBLIC_DEMO_MODE=false`와 `NEXT_PUBLIC_API_BASE_URL`을 함께 설정할 수 있습니다.

## 검증

```bash
npm run lint
npm run build
```
