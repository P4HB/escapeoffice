# 온라인 모드

게스트 공개판에는 백엔드가 필요하지 않습니다. 온라인 계정·랭킹·AI 대화를 사용할 때만 아래 절차를 적용합니다.

## 로컬 실행

저장소 루트에서:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(32))"
```

마지막 명령으로 생성한 값을 `backend/.env`의 `FLASK_SECRET_KEY`에 넣습니다.
.env 파일을 커밋하지 마세요. 로컬 HTTP에서는 `SESSION_COOKIE_SECURE=false`로 설정합니다.

```powershell
.\.venv\Scripts\python.exe -m backend.app
```

프론트엔드는 `frontend/.env.local`에 `VITE_GUEST_MODE=false`를 설정한 뒤 실행합니다.
Vite가 `/api`를 Flask의 5000번 포트로 전달하므로 별도 CORS 허용은 필요하지 않습니다.
기본 DB는 로컬 SQLite입니다. MySQL은 `DATABASE_URL`로 연결하며 제한된 권한의 앱 전용 계정을 사용합니다.

## 기존 MySQL 데이터 이전

1. 기존 DB를 백업하고 이전 서버를 중지합니다.
2. `DATABASE_URL`을 기존 DB로 설정합니다.
3. 다음 명령으로 password 열을 255자로 늘리고 기존 평문 비밀번호를 해시로 바꿉니다.

```powershell
.\.venv\Scripts\python.exe -m flask --app backend.app:create_app migrate-passwords
```

반복 실행해도 이미 해시된 비밀번호는 다시 바꾸지 않습니다. 이전 작업 전에는 기존 평문 계정으로 로그인할 수 없습니다.
신규 계정은 처음부터 Werkzeug의 scrypt 해시를 저장합니다.
기존 users.score는 보존하고, 현재 규칙의 최고 기록은 별도 scores 테이블에 소수 초 단위로 저장합니다.
이 작업은 대상 DB에 직접 실행해야 합니다. 코드 수정만으로 원격 DB가 변경되지는 않습니다.

## AI 대화

`GEMINI_API_KEY`와 사용 가능한 텍스트 생성 모델 ID인 `GEMINI_MODEL`을 모두 설정합니다.
기본 모델을 고정하지 않아 모델 종료 시 환경변수만 바꿀 수 있습니다.
구현은 [Gemini generateContent REST API](https://ai.google.dev/api/generate-content)를 사용합니다.
AI 응답은 서버와 클라이언트에서 각각 검증하고 기분 변화는 -10~10으로 제한합니다.
설정 누락·시간 초과·잘못된 응답은 오류 메시지를 반환하며, 플레이어는 보스 만나기로 계속 진행할 수 있습니다.
별도의 Node/Express 대화 서버는 사용하지 않습니다.

## 운영

HTTPS 앞단에서 `SESSION_COOKIE_SECURE=true`와 영구적인 비밀 키를 사용합니다.
서버는 디버그 모드 없이 실행합니다. 운영용 WSGI 실행 예:

```powershell
.\.venv\Scripts\waitress-serve.exe --host=127.0.0.1 --port=5000 --call backend.app:create_app
```

같은 도메인에서 프론트 빌드와 /api를 제공하거나 Flask가 frontend/dist를 서빙하게 합니다.
CSRF 토큰, HttpOnly/SameSite 세션 쿠키, 서버에서 결정한 사용자 ID로 쓰기 요청을 보호합니다.
새 배포 시 모든 인스턴스에 같은 비밀 키를 사용하세요.
인터넷 운영 시 앞단의 요청 제한을 적용하세요. 특히 로그인·회원가입·유료 AI 요청에 필요합니다.

랭킹 API는 인증한 사용자의 개인 최고 기록을 저장합니다. 전투 자체는 클라이언트에서 실행되므로
현재 설계는 클라이언트 변조까지 검증하는 경쟁 게임용 부정행위 방지 시스템이 아닙니다.

## 테스트

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```

테스트는 메모리 SQLite를 사용하며 원격 DB나 실제 Gemini API를 호출하지 않습니다.
