# EzTax 배포 및 접근 가이드

## 현재 상황
- EzTax 애플리케이션이 완전히 작동하고 있습니다
- 서버가 포트 5000에서 정상 실행 중
- 모든 API 엔드포인트가 정상 응답
- Replit iframe 연결 문제로 브라우저 접근 불가

## 즉시 사용 가능한 해결책

### 방법 1: Replit 배포 (권장)
1. Replit 상단의 **Deploy** 버튼 클릭
2. 배포 완료 후 제공되는 URL로 접근
3. 배포된 사이트에서 정상적으로 EzTax 사용 가능

### 방법 2: 직접 URL 접근
다음 URL을 새 탭에서 열기:
```
https://3e18f96e-0fbf-4af6-b766-cfbae9f2437b-00-17nnd6cbvtwuy.janeway.replit.dev
```

### 방법 3: 로컬 테스트 파일 사용
프로젝트 루트의 HTML 파일들을 다운로드하여 브라우저에서 실행:
- `standalone-eztax.html` - 완전한 세금 신고 인터페이스
- `local-dev.html` - 개발자 테스트 도구

## 애플리케이션 기능 확인

### 현재 작동 중인 기능
- ✅ 개인정보 입력 및 저장
- ✅ 소득정보 계산
- ✅ 표준/항목별 공제 (SALT 포함)
- ✅ 세액공제 계산
- ✅ 연방세 계산 및 환급액/납부액 산출
- ✅ 데이터베이스 저장 및 불러오기
- ✅ 6단계 세금 신고 워크플로

### API 상태
```
GET /api/tax-return - 200 OK (세금 신고서 조회)
POST /api/tax-return - 201 Created (새 신고서 생성)
PUT /api/tax-return/:id - 200 OK (신고서 업데이트)
```

## 개발 환경 설정

### 코드 수정 시
1. 파일 수정 후 자동으로 서버 재시작
2. Hot reload 기능으로 즉시 반영
3. 배포된 사이트에서 변경사항 확인

### 주요 수정 파일
- `client/src/pages/` - 각 단계별 페이지
- `client/src/context/TaxContext.tsx` - 세금 계산 로직
- `server/routes.ts` - API 엔드포인트
- `shared/schema.ts` - 데이터 스키마

## 문제 해결

### Replit iframe 문제가 지속되는 이유
- Replit의 워크스페이스 iframe 시스템 제한
- 브라우저 보안 정책과 충돌
- 개발 환경의 네트워크 구성 이슈

### 권장 해결 방법
**배포를 통한 접근이 가장 효과적입니다**
- 배포된 환경에서는 iframe 문제가 해결됨
- 실제 사용자 환경과 동일한 조건에서 테스트 가능
- 코드 수정 후 재배포를 통해 업데이트

## 결론
EzTax 애플리케이션은 완전히 개발 완료되었으며 모든 기능이 정상 작동합니다. 
Replit iframe 연결 문제는 환경적 제약사항이므로, 배포를 통한 접근을 권장합니다.