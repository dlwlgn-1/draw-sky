# 다시 그린 하늘

실제 별 위치에 나만의 선을 긋고 새 이름을 붙인 뒤, 별자리마다 그날 가장 잘 상상한 작품을 투표로 뽑는 모바일 웹 게임입니다.

- 게시된 페이지: https://claude.ai/artifact/5efJ7s1EX9DU2Gh8K9jgfX

## 개발

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # 게임 규칙 테스트
npm run build    # claude.ai 아티팩트용: dist/index.html (한 파일), dist/artifact.html (게시용), dist/sky.json
npm run build:web  # Firebase 웹사이트용: dist-web/ (.env.local 필요)
```

`.env.local`에 Firebase 설정이 없으면 `npm run dev`는 그려 보기 전용으로 열립니다(저장·투표는 claude.ai 아티팩트 안에서만). Firebase 설정을 넣으면 내 컴퓨터에서도 전부 동작합니다(아래 "공개 웹사이트: Firebase").

GitHub에 올리면 `.github/workflows/ci.yml`이 테스트와 빌드를 자동으로 돌립니다.

## 배포

### 지금: claude.ai 아티팩트

1. `npm run build`
2. `dist/artifact.html`을 페이지로, `dist/sky.json`을 같은 경로의 파일로 게시합니다(Claude에게 맡기거나 아티팩트 게시 도구 사용).
3. 기능 선언은 `artifact.capabilities.json`과 같게 둡니다: 공유 데이터베이스(`db`, 각자 자기 문서만 쓰기), 이름 표시(`user`), 이미지 저장(`downloads`), 지금 있는 사람(`room`).
4. 아티팩트의 **공유** 메뉴에서 함께할 사람에게 **참여자(Contributor)** 이상 권한을 줍니다. 보기 전용이면 구경만 할 수 있습니다.

아티팩트는 문서 틀(`<!doctype>`, `<head>`, `<body>`)을 스스로 붙이므로, `scripts/artifact.mjs`가 빌드 결과에서 그 틀을 걷어 냅니다.
작품·투표·뱃지 기록은 아티팩트에 딸린 데이터베이스에 있어서, 페이지를 새로 게시해도 그대로 남습니다.

### 공개 웹사이트: Firebase

같은 코드를 Firebase(익명 로그인 + Firestore + Hosting)로 돌리면 누구나 링크로 들어와 플레이할 수 있습니다.
`vite.config.js`가 `.env.local`에 Firebase 설정이 있으면 `src/backend/firebase.js`를, 없으면 `src/backend/claude.js`를 씁니다.

**1. Firebase 프로젝트 만들기** (https://console.firebase.google.com, 처음 한 번)
1. 프로젝트 추가 → 이름 입력(예: `draw-sky`) → Google 애널리틱스는 꺼도 됩니다.
2. 빌드 → **Authentication** → 시작하기 → 로그인 방법 → **익명** 사용 설정.
3. 빌드 → **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → 프로덕션 모드.
4. 프로젝트 설정(톱니바퀴) → 내 앱 → 웹(`</>`) 앱 추가 → 나오는 `firebaseConfig` 값을 둡니다.

**2. 내 컴퓨터에서 실행** (Windows 명령 프롬프트)
```cmd
cd draw-sky
copy .env.example .env.local
notepad .env.local
```
메모장에서 `firebaseConfig`의 `apiKey`, `authDomain`, `projectId`, `appId`를 채우고 저장한 뒤:
```cmd
npm install
npm run dev
```
http://localhost:5173 에서 닉네임으로 작품 올리기·별 주기·순위·뱃지·명예의 전당·지금 그리는 사람이 모두 동작합니다.

**3. 인터넷에 배포**
```cmd
npm install -g firebase-tools
firebase login
firebase use --add
npm run build:web
firebase deploy
```
`firebase use --add`에서 만든 프로젝트를 고르면 `.firebaserc`가 생깁니다. `firebase deploy`가 사이트(`dist-web/`)와 보안 규칙(`firestore.rules`: 모두 읽기, 각자 자기 문서만 쓰기)을 함께 올리고, 주소 `https://<프로젝트ID>.web.app`을 알려 줍니다. 고친 뒤에는 `npm run build:web`과 `firebase deploy`만 다시 하면 됩니다.

**알아 둘 점**
- 익명 로그인이라 브라우저마다 다른 사람이 됩니다. 기록을 지우거나 다른 기기에서 들어오면 새 사람으로 시작합니다(나중에 구글 로그인을 붙일 수 있습니다).
- Firestore의 줄 데이터는 배열 속 배열을 저장할 수 없어 `[a, b, a, b, …]`로 펴서 저장하고 읽을 때 되돌립니다(`backend/firebase.js`).
- 무료 요금제(Spark)는 하루 읽기 5만 번 같은 한도가 있습니다. "지금 있는 사람"은 이를 아끼려고 2분마다만 갱신합니다.
- claude.ai 아티팩트의 작품·기록과 Firebase의 작품·기록은 서로 다른 저장소입니다.

**로컬 에뮬레이터로 시험하기** (선택, Java 필요): `.env.local`에 `VITE_FIREBASE_PROJECT_ID=demo-draw-sky`, `VITE_FIREBASE_EMULATOR=1`을 넣고 `npx firebase-tools emulators:start --only auth,firestore --project demo-draw-sky`를 띄운 다음 `npm run dev`.

## 구조

```
index.html              화면 뼈대 (마크업)
public/sky.json         실제 별·은하수 데이터 (빌드 때 그대로 복사)
src/
  backend/
    claude.js           claude.ai 아티팩트 기능(공유 데이터베이스, 이름, 파일 저장, 실시간 접속)
    firebase.js         같은 모양의 Firebase 버전(익명 로그인, Firestore, 닉네임)
  main.js               시작점: 모듈을 연결하고 페이지를 엽니다
  styles.css            디자인
  data/
    constellations.js   놀이용 별자리 8개의 별과 원래 선·이야기, 이름 없는 하늘과 합친 전체 목록
    regions.js          이름 없는 하늘 10곳 (scripts/make-regions.mjs가 만듦)
    topics.js           오늘의 주제 목록
    deepSky.js          성운·은하·성단
  sky/                  하늘 그리기
    math.js             구면 좌표, 보간 같은 계산
    catalog.js          sky.json 불러오기, 별 밝기·색 묶음
    projection.js       평사도법 카메라 (하늘 → 화면 좌표), 별자리 맞춤
    render.js           배경, 은하수, 성운, 별, 고른 별자리 그리기
    chalk.js            분필처럼 그어지는 선
    motion.js           별자리 사이 이동 연출, 선이 서서히 나타나는 효과
    thumb.js            목록용 작은 그림
    card.js             공유용 이미지 카드(1080×1350)
  game/                 게임 규칙과 데이터
    rules.js            순위 계산, 저장 데이터 검증, 투표, 7일 보관 (DOM 없음 → 테스트 대상)
    time.js             한국 시간 기준 하루
    topic.js            날짜로 오늘의 별자리·주제 정하기
    badges.js           뱃지 정의, 뱃지용 기록 쌓기·검증
    progress.js         받은 별·1위 기록을 순위에서 읽어 뱃지·명예의 전당 갱신
    hall.js             명예의 전당 목록 만들기
    presence.js         지금 같은 하늘에 있는 사람 세기
    state.js            공유 상태와 그 위의 읽기 함수
    store.js            공유 데이터베이스 연결, 내 문서 쓰기, 이름 불러오기
    actions.js          선 긋기, 별자리 이동, 작품 보기, 투표, 올리기, 내리기
  ui/                   화면
    panels.js           위·아래 조작부, 작품 카드, 시트(올리기·순위·별자리 목록)
    controls.js         버튼, 입력 폼, 키보드
    skyInput.js         하늘 위 터치: 별 잇기, 좌우 스와이프
    intro.js            첫 화면 (별을 밀어 올려 입장)
    clock.js            마감까지 남은 시간
    badges.js           뱃지 메달 그림, 내 뱃지 창, 획득 알림
    dom.js              DOM 도우미, 색, 토스트, 좌표 표기
tests/                  게임 규칙·오늘의 주제·뱃지 테스트 (node:test)
scripts/artifact.mjs    빌드 결과를 아티팩트 게시 형식으로 바꾸기
scripts/make-regions.mjs  실제 별 데이터에서 이름 없는 하늘 구역 만들기
artifact.capabilities.json  아티팩트에 선언하는 기능 목록
firebase.json, firestore.rules, .env.example  Firebase 호스팅·보안 규칙·설정 예시
.github/workflows/ci.yml    푸시마다 테스트·빌드
```

## 게임 규칙

- 이름 있는 별자리 8개(오리온, 큰곰, 카시오페이아, 백조, 전갈, 사자, 쌍둥이, 거문고)와 **이름 없는 하늘** 10곳. 이름 없는 하늘은 실제 별 목록에서 별이 많은 구역을 잘라 만든 놀이터로, 옛 그림이 없습니다(`scripts/make-regions.mjs`가 `src/data/regions.js`를 만듭니다).
- 한 사람은 별자리마다 하루 한 작품을 올리고, 같은 날 안에서는 고쳐 올릴 수 있습니다.
- 별자리마다 하루 한 작품에만 별(투표)을 줄 수 있고, 자기 작품에는 줄 수 없습니다.
- 하루는 한국 시간 자정에 바뀌며, 작품과 투표는 7일 동안 보관됩니다.
- **오늘의 주제:** 2026-10-28부터는 이름 없는 하늘도 오늘의 주제로 돌아옵니다. 날짜마다 하늘 하나와 그리기 주제 하나가 정해집니다(`src/game/topic.js`). 서버 없이 날짜만으로 계산하므로 모두에게 같습니다. 별자리는 8일마다 한 바퀴 돌고 이틀 연속 같은 별자리는 나오지 않으며, 주제는 목록(`src/data/topics.js`, 40개)을 다 쓰기 전에는 반복되지 않습니다. 새로 들어오면 오늘의 별자리에서 시작합니다. 다른 별자리도 지금처럼 자유롭게 그릴 수 있습니다.
- **명예의 전당:** 하루가 끝나면 별자리마다 1위(별 1개 이상) 작품이 남습니다. 작품은 7일 뒤 지워지므로 1위 작품의 사본을 1위한 사람의 문서(`hall`)에 영구 보관하고, 아직 지워지지 않은 날은 순위에서 바로 계산합니다(`src/game/hall.js`).
- **지금 그리는 사람:** 같은 하늘을 보고 있거나 그리고 있는 사람 수를 제목, 하늘 위 별자리 이름, 별자리 목록에 보여 줍니다. 아티팩트의 실시간 접속(`room`) 기능으로 `{ cid, drawing }`만 나누고, 저장하지 않습니다(`src/game/presence.js`).
- **뱃지:** 16개(`src/game/badges.js`). 첫 작품, 오늘의 주제 도전/장인, 8개 별자리 완주, 개척자(이름 없는 하늘), 3일·7일 연속, 첫 별/별 5개, 그날의 1위/3번, 별 나눔, 이야기꾼, 큰 그림, 올빼미, 숨은 뱃지(원래 별자리와 똑같이 긋기). 작품·투표와 달리 뱃지에 쓰이는 기록은 지워지지 않습니다. 각자 자기 문서에 쓰는 개인 기록이라, 남과 겨루는 공식 기록으로 쓰기에는 맞지 않습니다.

## 저장 구조

작품과 투표는 아티팩트의 공유 데이터베이스(`db` 기능)에 저장됩니다.

- 문서 경로: `players/<사용자 ID>` (각자 자기 문서만 쓸 수 있음)
- 문서 모양:

```json
{
  "entries": {
    "2026-10-27_ori": { "c": "ori", "d": "2026-10-27", "name": "…", "story": "…", "lines": [[0, 2], [2, 5]], "t": 1793000000000 }
  },
  "votes": {
    "2026-10-27": { "ori": "<별을 준 작품의 작성자 ID>" }
  },
  "stats": {
    "posts": 1, "topicPosts": 1, "stories": 1, "given": 0, "drawn": { "ori": 1 },
    "streak": 1, "best": 1, "lastDay": "2026-10-27", "maxStars": 0,
    "wins": { "2026-10-26_ori": 1 }, "marks": { "big": 1 }, "badges": { "first": "2026-10-27" }
  },
  "hall": {
    "2026-10-26_ori": { "c": "ori", "d": "2026-10-26", "name": "…", "story": "…", "lines": [[0, 2]], "votes": 3, "t": 1793000000000 }
  }
}
```

- 접근 규칙: `players`는 모두 읽기, `players/{self}`는 참여자(Contributor) 이상이 자기 문서만 쓰기

## 알려진 한계

- 모든 사람의 문서를 한 번에 최대 1,000개까지 받아 순위를 계산합니다. 참여자가 그보다 많아지면 순위가 사람마다 달라질 수 있어, 날짜별로 필요한 문서만 받는 구조로 바꿔야 합니다. (내 문서는 따로 받아서, 내 기록이 덮어써지는 일은 없습니다.)
- 뱃지는 각자 자기 문서에 쓰는 개인 기록이라, 조작을 막는 공식 기록으로 쓰기에는 맞지 않습니다.

## 데이터 출처

- 별: XHIP — An Extended Hipparcos Compilation (Anderson & Francis 2012, VizieR V/137D)
- 은하수 윤곽과 별 데이터 가공: [d3-celestial](https://github.com/ofrohn/d3-celestial) 0.7.35, Copyright (c) 2015 Olaf Frohn, BSD 3-Clause License (`THIRD_PARTY_d3-celestial-LICENSE.txt`)
- 성운·은하의 위치와 크기는 공개된 천체 목록 값을 바탕으로 직접 넣었습니다.
